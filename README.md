# divdes
Project on lack of diversity in STEM fields at the University of Illinois.

## Prereqs:
* Node v5.x & npm 3.x
* ImageMagick 6.9.2-10
* Gulp (`npm install -g gulp`)

## Build
`npm install` to grab dependencies. Use `gulp dev` to watch files in src and scripts for changes. Scripts in `src` are backend scripts to resize the characters and background images. Scripts in `scripts` are scripts to run in browser. They are transpiled and put into `public`.

Run `node bin/resizeBG` to convert the background images. Run `node bin/resizeImages` to convert the caricatures. Serve project root from webserver.

Note: when running `node bin/resizeImages` you may run out of memory. If that's the case, comment out a few characters in the CHARS array in `src/resizeImages.js`, run the script, and then uncomment the commented out characters and comment out the others and run it again.
