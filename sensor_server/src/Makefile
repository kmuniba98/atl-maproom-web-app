# system information
platform=$(shell uname -s 2>/dev/null)
platform_lcase=$(shell uname -s 2>/dev/null | tr '[:upper:]' '[:lower:]')
arch=$(shell uname -m)

CC=cc
CFLAGS=-Wall -fPIC $(INC) #-Wextra -Winit-self -Wuninitialized -Wmissing-declarations -Winit-self -ansi -pedantic
DEBUG=#-g

ifeq ($(platform), Darwin)
    # Mac
	HID=
	INC=`pkg-config --cflags-only-I libusb-1.0`
	LIB=`pkg-config --libs libusb-1.0` `pkg-config --libs hidapi`
	SONAME=-install_name
else # Linux
	HID_O=hid-libusb.o
	HID_C=hid-libusb.c
	INC=`pkg-config --cflags-only-I libusb-1.0`
	LIB=-lpthread -lusb-1.0
	SONAME=-soname
endif

all: ranger_test liblr4ranger.so.1

ranger_test.o:ranger_test.c
	$(CC) $(CFLAGS) -c ranger_test.c

hid-libusb.o:hid-libusb.c hidapi.h
	$(CC) $(CFLAGS) -c hid-libusb.c

lr4ranger.o:lr4ranger.c lr4ranger.h 
	$(CC) $(CFLAGS) -c lr4ranger.c 

liblr4ranger.so.1:lr4ranger.o
	$(CC) $(CFLAGS) $(DEBUG) -shared -Wl,$(SONAME),liblr4ranger.so.1 -o liblr4ranger.so.1 lr4ranger.c $(HID_C) $(LIB)

ranger_test:lr4ranger.o ranger_test.o $(HID_O)
	$(CC) $(DEBUG) -o ranger_test ranger_test.o lr4ranger.o $(HID_O) $(LIB)

clean::
	rm -f *.o ranger_test

distclean::
	rm -f *.o ranger_test *.so.1
	rm -rf *.o ranger_test *.so.1.dSYM
	rm -f liblr4ranger.so.1
