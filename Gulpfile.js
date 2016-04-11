var gulp = require('gulp');
var babel = require('gulp-babel');
var browserify = require('browserify');
var babelify = require('babelify');


gulp.task('backendjs',function() {
    return gulp.src('src/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('bin'))
});

gulp.task('frontend', function() {
    var fs = require("fs");
    var browserify = require("browserify");
    browserify("./scripts/main.js")
        .transform("babelify", {presets: ["es2015"]})
        .bundle()
        .pipe(fs.createWriteStream("./public/scripts/main_two.js"));
});

gulp.task('dev',['backendjs','frontend'], function() {
    gulp.watch('src/**/*.js', ['backendjs']);
    gulp.watch('scripts/**/*.js', ['frontend'])
});