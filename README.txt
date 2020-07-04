### enamel pin - blackle / suricrasia online ###
BLACK LIVES MATTER - TRANS RIGHTS ARE HUMAN RIGHTS

enamel pin is a 4k exegfx for 64-bit linux, specifically targeting Ubuntu 18.10

Packages needed (all of these are installed by default):

libglib2.0-0
libgtk-3-0
and whatever package gives you libgl (depends on graphics card)

Two versions of the demo are distributed. enamel_pin is the size optimized, packed version. enamel_pin_unpacked is the unpacked version that is missing some heavy size optimizations.

This exegfx will not render on resolutions lower than 1920x1080. What it produces at higher resolutions is untested.

Exit at any moment with "esc" or with your window manager's "close window" key combo.

You can set the number of samples with the environment variable SAMPLES:

env SAMPLES=100 ./enamel_pin

The default number of samples is 100. It takes about 6 seconds to render on a 1660 Ti.
