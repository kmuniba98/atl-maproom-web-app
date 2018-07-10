/*
 API to communicate with the Porcupine LR4 USB Laser Rangefinder

 Kevin Gamiel <kgamiel@islandedge.com>
 http://www.islandedge.com
 1/31/2014

 Copyright (c) 2014, Island Edge Consulting, LLC
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met: 

 1. Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer. 
 2. Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution. 

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 The views and conclusions contained in the software and documentation are those
 of the authors and should not be interpreted as representing official policies, 
 either expressed or implied, of the FreeBSD Project.
 */
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>
#include "lr4ranger.h"
#include <pthread.h>
#include <limits.h>
#include <sys/time.h>

typedef enum {
	CMD_NONE, CMD_STOP
} thread_cmd_t;

typedef struct _lr4ranger_t {
	hid_device *hid_handle;
	unsigned int orig_configuration;
	unsigned int configuration;
	int read_timeout_ms;
	FILE *fp;
	pthread_t thread;
	thread_cmd_t cmd;
	pthread_mutex_t mutex;
	short in_use;
	time_t interval_s;
} lr4ranger_t;

#define MAX_RANGERS 16
static lr4ranger_t g_ranger[MAX_RANGERS];
static pthread_mutex_t g_mutex = PTHREAD_MUTEX_INITIALIZER;

#define STS_MEASUREMENT_DATA    0x00
#define CMD_GET_CONFIG          0x00
#define CMD_SET_CONFIG          0x01
#define CMD_WRITE_CONFIG        0x02
#define STS_CONFIG_DATA         0x01
#define MAX_OPEN_TRIES          16
#define MAX_SAMPLE_TRIES        10
#define MAX_RANGE_SAMPLES       5
#define RANGER_READ_TIMEOUT_MS  1000

#define CFG_UNIT_FEET_AND_INCHES 0x00000000
#define CFG_UNIT_METERS          0x00000001
#define CFG_UNIT_FEET            0x00000002
#define CFG_UNIT_INCHES          0x00000003
#define CFG_UNIT_CM              0x00000004

#define CFG_MODE_CONTINUOUS      0x00000000
#define CFG_MODE_SINGLE          0x00000008
#define CFG_MODE_INTERVAL        0x00000010

#define CFG_DO_DOUBLE            0x00000400

#define CFG_RUN                  0x00008000

#define CFG_FILTER_ERRORS        0x00000400

#define DEFAULT_CONFIG                  0x00

/*
 configuration bits
 // Distance Display: Bits[2:0]
 //     000 = Feet & Inches
 //     001 = Meters
 //     010 = Feet
 //     011 = Inches
 //     100 = Centimeters
 //     101 - 111 = Reserved
 // Measurement Mode: Bits[4:3]
 //      00 = Continuous
 //      01 = Single
 //      10 = Interval
 //      11 = Reserved
 // Interval Units: Bits[6:5]
 //      00 = Seconds
 //      01 = Minutes
 //      10 = Hours
 //      11 = Reserved
 // Trigger: Bits[8:7]
 //      00 = "Start" Button
 //      01 = Caps Lock
 //      10 = Num Lock
 //      11 = Scroll Lock
 // Keyboard Enulation Mode: Bit 9  (0 = Disabled / 1 = Enabled)
 // Do Double Measurements:  Bit 10 (0 = Disabled / 1 = Enabled)
 // Don't Filter Errors:     Bit 11 (0 = Disabled (filter on) / 1 = Enabled (filter off))
 // Only Send Changes:       Bit 12 (0 = Disabled / 1 = Enabled)
 // LED 1:                   Bit 13 (0 = Off / 1 = On)
 // LED 2:                   Bit 14 (0 = Off / 1 = On)
 // Laser Rangefinder Run:   Bit 15 (0 = Not running / 1 = Running)
 // Interval: Bits[31:16]
 //     16 Bit Unsigned Integer
 */
static int lr4ranger_set_configuration(lr4ranger_t *r,
		unsigned int config_value) {
	unsigned char cmd_buf[8];

	cmd_buf[0] = (unsigned char) CMD_SET_CONFIG;
	cmd_buf[1] = (unsigned char) (config_value);
	cmd_buf[2] = (unsigned char) (config_value >> 8);
	cmd_buf[3] = (unsigned char) (config_value >> 16);
	cmd_buf[4] = (unsigned char) (config_value >> 24);
	cmd_buf[5] = (unsigned char) 0;
	cmd_buf[6] = (unsigned char) 0;
	cmd_buf[7] = (unsigned char) 0;

	if (hid_write(r->hid_handle, cmd_buf, sizeof(cmd_buf))
			!= (int) sizeof(cmd_buf)) {
		return 0;
	}

	r->configuration = config_value;
	return 1;
}

static int lr4ranger_write_configuration(lr4ranger_t *r) {
	unsigned char cmd_buf[8];

	cmd_buf[0] = (unsigned char) CMD_WRITE_CONFIG;
	cmd_buf[1] = (unsigned char) 0;
	cmd_buf[2] = (unsigned char) 0;
	cmd_buf[3] = (unsigned char) 0;
	cmd_buf[4] = (unsigned char) 0;
	cmd_buf[5] = (unsigned char) 0;
	cmd_buf[6] = (unsigned char) 0;
	cmd_buf[7] = (unsigned char) 0;

	if (hid_write(r->hid_handle, cmd_buf, sizeof(cmd_buf))
			!= (int) sizeof(cmd_buf)) {
		return 0;
	}

	return 1;
}

static int lr4ranger_get_configuration(lr4ranger_t *r,
		unsigned int *configuration) {
	unsigned char cmd_buf[8];
	unsigned char status_buf[8];
	int result = 1;

	cmd_buf[0] = (unsigned char) CMD_GET_CONFIG;
	cmd_buf[1] = (unsigned char) 0;
	cmd_buf[2] = (unsigned char) 0;
	cmd_buf[3] = (unsigned char) 0;
	cmd_buf[4] = (unsigned char) 0;
	cmd_buf[5] = (unsigned char) 0;
	cmd_buf[6] = (unsigned char) 0;
	cmd_buf[7] = (unsigned char) 0;

	if (hid_write(r->hid_handle, cmd_buf, sizeof(cmd_buf))
			!= (int) sizeof(cmd_buf)) {
		return 0;
	}

	if (hid_read_timeout(r->hid_handle, (unsigned char *) (&status_buf[0]),
			sizeof(status_buf), 1000) > -1) {
		if (status_buf[0] == (unsigned char) STS_CONFIG_DATA) {
			*configuration = (unsigned int) (status_buf[1]
					+ (status_buf[2] << 8) + (status_buf[3] << 16)
					+ (status_buf[4] << 24));
		} else {
			result = 0;
		}
	}

	return result;
}

static lr4ranger_result_t validate_handle(lr4ranger_handle_t handle,
		lr4ranger_t **ptr) {
	int err;
	int result = RANGER_OK;

	if ((handle < 0) || (handle >= MAX_RANGERS)) {
		return RANGER_INVALID_HANDLE;
	}

	if ((err = pthread_mutex_lock(&g_mutex)) != 0) {
		fprintf(stderr, "Error: pthread_create, %s\n", strerror(err));
		return RANGER_THREAD_ERROR;
	}
	if (g_ranger[handle].in_use == 0) {
		result = RANGER_INVALID_HANDLE;
	}
	if ((err = pthread_mutex_unlock(&g_mutex)) != 0) {
		fprintf(stderr, "Error: pthread_create, %s\n", strerror(err));
		return RANGER_THREAD_ERROR;
	}
	*ptr = &g_ranger[handle];

	return result;
}

static lr4ranger_handle_t get_free_handle() {
	int err;
	int i;
	int handle = -1;

	if ((err = pthread_mutex_lock(&g_mutex)) != 0) {
		fprintf(stderr, "Error: pthread_create, %s\n", strerror(err));
		return RANGER_THREAD_ERROR;
	}
	for (i = 0; i < MAX_RANGERS; i++) {
		if (g_ranger[i].in_use == 0) {
			handle = i;
			g_ranger[handle].in_use = 1;
			break;
		}
	}
	if ((err = pthread_mutex_unlock(&g_mutex)) != 0) {
		fprintf(stderr, "Error: pthread_create, %s\n", strerror(err));
		return RANGER_THREAD_ERROR;
	}

	return handle;
}

static double get_time_millis() {
	struct timeval  tv;

	gettimeofday(&tv, NULL);
	return (tv.tv_sec) * 1000 + (tv.tv_usec) / 1000;
}

#ifdef FLUSH
static void flush(lr4ranger_t *r) {
	unsigned char measurement[8];
	double start = get_time_millis();
	double elapsed = 0.0;

	for(;;) {
		double now = get_time_millis();

		if(hid_read(r->hid_handle, &measurement[0], sizeof(measurement)) == 0) {
			break;
		}
		elapsed = now - start;
		printf("elapsed=%.2f\n", elapsed);
		if(elapsed > 500) {
			break;
		}
	}
}
#endif

lr4ranger_result_t lr4ranger_open_serial(lr4ranger_handle_t *handle,
		wchar_t *serial_number) {
	int try;
	lr4ranger_t *r;

	/* find an empty slot */
	if (((*handle) = get_free_handle()) == -1) {
		return RANGER_NO_MORE_HANDLES;
	}
	r = &(g_ranger[*handle]);

	/* clear the struct */
	memset(r, (int )sizeof(lr4ranger_t), 0);

	g_ranger[*handle].read_timeout_ms = RANGER_READ_TIMEOUT_MS;

	/* open USB connection to the ranger */
	for (try = 0; try < MAX_OPEN_TRIES; try++) {
		if ((r->hid_handle = hid_open(0x0417, 0xdd03, serial_number)) == NULL ) {
			usleep(1000 * 100);
			continue;
		}
		break;
	}
	if (try == MAX_OPEN_TRIES) {
		return RANGER_ERR_OPEN_FAILED;
	}
	hid_set_nonblocking(r->hid_handle, 1);

	/* save the original configuration so we can restore it when done */
	if (lr4ranger_get_configuration(r, &(r->orig_configuration)) == 0) {
		return RANGER_ERR_GET_CONFIG;
	}

	if (pthread_mutex_init(&r->mutex, NULL )) {
		fprintf(stderr, "Failed to init mutex\n");
	}

	return RANGER_OK;
}

lr4ranger_result_t lr4ranger_open(lr4ranger_handle_t *handle) {
	return lr4ranger_open_serial(handle, NULL );
}

#define VALIDATION() \
    lr4ranger_result_t result = RANGER_OK; \
    lr4ranger_t *r; \
    if((result = validate_handle(handle, &r)) != RANGER_OK) { \
        return result; \
    }

lr4ranger_result_t lr4ranger_reset(lr4ranger_handle_t handle) {
	unsigned int c;
	VALIDATION()

	if (lr4ranger_set_configuration(r, DEFAULT_CONFIG) != 1) {
		return RANGER_ERR_SET_CONFIG;
	}

	if (lr4ranger_get_configuration(r, &c) != 1) {
		return RANGER_ERR_SET_CONFIG;
	}

	if (lr4ranger_write_configuration(r) != 1) {
		return RANGER_ERR_SET_CONFIG;
	}

	return RANGER_OK;
}

/*
 * There is something I don't understand about the operation yet.  Sometimes
 * it seems to return cached values before the laser even turns on.  Is there
 * a way to query the laser status?  Or flush the cache?
 */
unsigned int get_range(lr4ranger_t *r) {
	unsigned int result = 0;
	unsigned char measurement[8];
	int res;
	int num_read = 0;
	int try;
	double start = get_time_millis();

	//flush(r);

	/* we read all available at the moment and keep the last */
	for(try = 0; ; try++) {
		double now = get_time_millis();
		if((now - start) > 500) {
			break;
		}
		/* not sure why I need this */
		usleep(10);

		res = hid_read(r->hid_handle, &measurement[0],
				sizeof(measurement));
		if (res == 0) {
			/* no data available this time */
			if(num_read > 1) {
				/* we read some earlier, so break */
				break;
			}
		} else if (res == -1) {
			fprintf(stderr, "hid_read_timeout() failed\n");
			break;
		} else {
			/* we have data */
			if ((res == 8)
					&& (measurement[0] == (unsigned char) STS_MEASUREMENT_DATA)) {
				result =
						(unsigned int) ((measurement[2] << 8) + measurement[1]);
				num_read++;
			}
		}
	}

	return result;
}

/*
 Get a single range reading and stores in range parameter.
 */
lr4ranger_result_t lr4ranger_get_range(lr4ranger_handle_t handle,
		unsigned int *range) {
	VALIDATION()

	r->configuration = CFG_MODE_CONTINUOUS;
	if (lr4ranger_set_configuration(r, r->configuration) == 0) {
		return RANGER_ERR_SET_CONFIG;
	}

	r->configuration |= CFG_RUN;
	if (lr4ranger_set_configuration(r, r->configuration) == 0) {
		return RANGER_ERR_SET_CONFIG;
	}

	*range = get_range(r);

	/* stop running */
	if (lr4ranger_set_configuration(r, 0) != 1) {
		result = RANGER_ERR_SET_CONFIG;
	}

	return result;
}

lr4ranger_result_t lr4ranger_close(lr4ranger_handle_t handle) {
	VALIDATION()

	(void) lr4ranger_set_configuration(r, 0);
	(void) hid_exit();

	return result;
}

void *thread_main(void *user) {
	double last_reading = 0;
	int *handle_ptr = (int*) user;
	int handle = *handle_ptr;
	lr4ranger_t *r = &g_ranger[handle];

	for (;;) {
		int terr;
		double elapsed;
		unsigned int range;
		thread_cmd_t cmd;
		double now;

		now = get_time_millis();

		terr = pthread_mutex_lock(&r->mutex);
		cmd = r->cmd;
		terr = pthread_mutex_unlock(&r->mutex);
		if (cmd == CMD_STOP) {
			break;
		}
		range = get_range(r);
		elapsed = (now - last_reading);
		if (elapsed < (double)(r->interval_s * 1000.0)) {
			continue;
		}
		last_reading = now;
		if (range > 0) {
			time_t rawtime;
			struct tm * timeinfo;
			static char buf[64];

			time (&rawtime);
			timeinfo = localtime (&rawtime);

			(void)strftime(buf, sizeof(buf), "%FT%T", timeinfo);
			fprintf(r->fp, "%s\t%i\n", buf, range);
			fflush(r->fp);
		}
	}

	return NULL ;
}

lr4ranger_result_t lr4ranger_start_collecting(lr4ranger_handle_t handle,
		const char *filename, int interval_in_seconds) {

	VALIDATION()

	r->interval_s = interval_in_seconds;

	if ((r->fp = fopen(filename, "w")) == NULL ) {
		perror(filename);
		return RANGER_INVALID_FILENAME;
	}

	r->configuration = CFG_MODE_CONTINUOUS;
	if (lr4ranger_set_configuration(r, r->configuration) == 0) {
		return RANGER_ERR_SET_CONFIG;
	}

	r->configuration |= CFG_RUN;
	if (lr4ranger_set_configuration(r, r->configuration) == 0) {
		return RANGER_ERR_SET_CONFIG;
	}

	/* create the thread that will read samples */
	if (pthread_create(&r->thread, NULL, thread_main, (void*) &handle)) {
		fprintf(stderr, "Error creating thread\n");
		return RANGER_THREAD_ERROR;
	}

	return RANGER_OK;
}

lr4ranger_result_t lr4ranger_stop_collecting(lr4ranger_handle_t handle) {
	int err;
	VALIDATION()

	/* signal the thread that we're done */
	err = pthread_mutex_lock(&g_mutex);
	r->cmd = CMD_STOP;
	err = pthread_mutex_unlock(&g_mutex);

	if (pthread_join(r->thread, NULL )) {
		fprintf(stderr, "Error joining thread\n");
		return RANGER_THREAD_ERROR;
	}

	if (lr4ranger_set_configuration(r, 0) != 1) {
		result = RANGER_ERR_SET_CONFIG;
	}

	if (r->fp != NULL ) {
		fclose(r->fp);
	}

	return RANGER_OK;
}

