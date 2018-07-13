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
#ifndef _RANGER_H_
#define _RANGER_H_

#include "hidapi.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
	RANGER_OK,
	RANGER_ERR_SET_CONFIG,
	RANGER_ERR_GET_CONFIG,
	RANGER_ERR_GET_RANGE,
	RANGER_ERR_OPEN_FAILED,
	RANGER_ERR_NO_RESPONSE,
	RANGER_ERR_READ_FAILED,
	RANGER_INVALID_HANDLE,
	RANGER_INVALID_FILENAME,
	RANGER_THREAD_ERROR,
	RANGER_NO_MORE_HANDLES
} lr4ranger_result_t;

typedef int lr4ranger_handle_t;

lr4ranger_result_t lr4ranger_open(lr4ranger_handle_t *handle);
lr4ranger_result_t lr4ranger_open_serial(lr4ranger_handle_t *handle,
		wchar_t *serial_number);
lr4ranger_result_t lr4ranger_reset(lr4ranger_handle_t handle);
lr4ranger_result_t lr4ranger_get_range(lr4ranger_handle_t handle,
		unsigned int *range);
lr4ranger_result_t lr4ranger_close(lr4ranger_handle_t handle);
lr4ranger_result_t lr4ranger_start_collecting(lr4ranger_handle_t handle,
		const char *filename, int interval_in_seconds);
lr4ranger_result_t lr4ranger_stop_collecting(lr4ranger_handle_t handle);

#ifdef __cplusplus
}
#endif

#endif

