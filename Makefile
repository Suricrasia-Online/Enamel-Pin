# ----------------------------------------
# HEY YOU! YEAH YOU! THE ONE READING THIS!
# ----------------------------------------
# Interested in demoscene on linux? join us in
# the Linux Sizecoding channel! #lsc on IRCNET!
# ----------------------------------------

# notes on the build system:
# ~$ uname -a
# Linux stardrifter 5.4.0-0.bpo.2-amd64 #1 SMP Debian 5.4.8-1~bpo10+1 (2020-01-07) x86_64 GNU/Linux
# ~$ gcc -dumpversion
# 8
# ~$ nasm --version
# NASM version 2.14
# ~$ lzma --version
# xz (XZ Utils) 5.2.4
# liblzma 5.2.4
# ~$ dpkg-query --showformat='${Version}' --show libglib2.0-dev
# 2.58.3-2+deb10u2
# ~$ dpkg-query --showformat='${Version}' --show libgtk-3-dev:amd64
# 3.24.5-1
# ~$ dpkg-query --showformat='${Version}' --show mesa-common-dev:amd64
# 18.3.6-2+deb10u1

PROJNAME := enamel_pin

#huge greets to donnerbrenn!
CFLAGS = -Os -s -march=nocona -std=gnu11

CFLAGS += -fno-plt
CFLAGS += -fno-stack-protector -fno-stack-check
CFLAGS += -fno-unwind-tables -fno-asynchronous-unwind-tables -fno-exceptions
CFLAGS += -funsafe-math-optimizations -ffast-math
CFLAGS += -fomit-frame-pointer
CFLAGS += -ffunction-sections -fdata-sections
CFLAGS += -fmerge-all-constants
CFLAGS += -fno-PIC -fno-PIE
CFLAGS += -malign-data=cacheline
CFLAGS += -mno-fancy-math-387 -mno-ieee-fp
CFLAGS += -Wall
CFLAGS += -Wextra
CFLAGS += -no-pie

CFLAGS += -nostartfiles -nodefaultlibs
CFLAGS += `pkg-config --cflags gtk+-3.0`

LDFLAGS = -lc -lGL -lglib-2.0 -lgobject-2.0 -lgtk-3 -lgdk-3

.PHONY: clean check_size noelfver

all : $(PROJNAME) check_size

$(PROJNAME).zip : $(PROJNAME) $(PROJNAME)_unpacked README.txt screenshot.jpg
	-rm $@
	zip $@ $^

packer : vondehi/vondehi.asm 
	cd vondehi; nasm -fbin -o vondehi -DWANT_ARGV -DNO_CHEATING vondehi.asm

noelfver : noelfver/noelfver.c
	make -C noelfver/

shader.h : shader.frag Makefile
	mono ./shader_minifier.exe --no-renaming-list ss,main shader.frag -o shader.h

$(PROJNAME).o : $(PROJNAME).c shader.h Makefile
	gcc -c -o $@ $< $(CFLAGS)

$(PROJNAME).elf.smol : $(PROJNAME).o
	python3 ./smol/smold.py --smolrt "$(PWD)/smol/rt" --smolld "$(PWD)/smol/ld" -fuse-interp $(LDFLAGS) $< $@

$(PROJNAME)_unpacked : $(PROJNAME).c shader.h Makefile
	gcc -o $@ $< $(CFLAGS) $(LDFLAGS)

$(PROJNAME) : $(PROJNAME).elf.smol.packed
	mv $< $@

%.xz : % Makefile
	-rm $@
	./nicer.py $< -o $@

%.packed : %.xz packer Makefile
	cat ./vondehi/vondehi $< > $@
	chmod +x $@

clean :
	-rm *.elf *.xz shader.h $(PROJNAME) $(PROJNAME)_unpacked

check_size :
	./sizelimit_check.sh