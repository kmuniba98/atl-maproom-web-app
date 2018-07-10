#! /usr/bin/env python
#
# Simple python script that demonstrates using the lr4ranger C library for
# communicating with the Porcupine LR4 Laser Rangerfinder.
#
# This script shows how to load the library dynamically and make appropriate
# calls into it.  It opens a connection to the ranger, starts collecting
# data into a file, sleeps for awhile, stops collecting and disconnects.
#
import ctypes
import time
import sys
import os

#
# Full path to C library (we assume it's in ../src directory here)
#
library_path = os.path.abspath(os.path.dirname(__file__) +
    '/../src/liblr4ranger.so.1')

#
# load the lr4ranger dynamic library.
#
lr4ranger_lib = ctypes.CDLL(library_path)

#
# try to open USB connection to ranger
#
handle = ctypes.c_int()
result = lr4ranger_lib.lr4ranger_open(ctypes.byref(handle))
if result != 0:
    print 'Failed to open ranger: ' + str(result)
    sys.exit(1)

#
# Get a single range
#


for i in range (1000):
    range = ctypes.c_int()
    result = lr4ranger_lib.lr4ranger_get_range(handle, ctypes.byref(range))
    if result != 0:
        print 'Failed to get range: ' + str(result)
    if range.value == 0:
        continue
    else:
        print str(range.value)
        sys.stdout.flush()

    time.sleep(1)





"""

collect=True
if collect:
    #
    # start ranger collecting data to a file
    #
    data_file = 'data.txt'
    result = lr4ranger_lib.lr4ranger_start_collecting(handle, data_file, 1)
    if result != 0:
        print 'Failed to start collecting: ' + str(result)
    else:
        #
        # You could do other stuff here, e.g. move servos
        #
        print 'collecting...'
        time.sleep(10)
        print 'done collecting'

        #
        # We're done moving servos, stop collecting data
        #
        result = lr4ranger_lib.lr4ranger_stop_collecting(handle)
        if result != 0:
            print 'Failed to stop collecting: ' + str(result)

"""
#
# Always close the USB connection!
#
result = lr4ranger_lib.lr4ranger_close(handle)
if result != 0:
    print 'Failed to stop collecting: ' + str(result)
