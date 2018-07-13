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
#include "lr4ranger.h"

int main(int argc, char **argv) {
	lr4ranger_result_t result;
	lr4ranger_handle_t handle;
	unsigned int range_mm;
	(void) argc;
	(void) argv;

	/* Try to open the ranger */
	printf("Trying to connect to ranger...\n");
	if ((result = lr4ranger_open(&handle)) != RANGER_OK) {
		fprintf(stderr, "lr4ranger_open() failed with %i\n", result);
		return 1;
	}

	printf("Trying to reset the ranger...\n");
	fflush(stdout);
	lr4ranger_reset(handle);

	/* Get the range */
	printf("Getting range...\n");
	fflush(stdout);
	if ((result = lr4ranger_get_range(handle, &range_mm)) != RANGER_OK) {
		fprintf(stderr, "lr4ranger_get_range() failed with %i\n", result);
	} else {
		printf("range: %i mm\n", range_mm);
	}

	if ((result = lr4ranger_start_collecting(handle, "data.txt", 1))
			!= RANGER_OK) {
		fprintf(stderr, "lr4ranger_start_collecting() failed with %i\n",
				result);
	} else {
		sleep(10);
		if ((result = lr4ranger_stop_collecting(handle)) != RANGER_OK) {
			fprintf(stderr, "lr4ranger_stop_collecting() failed with %i\n",
					result);
		}
	}

	/* Close the ranger */
	printf("Disconnecting...\n");
	lr4ranger_close(handle);

	return 0;
}
