var gulp = require('gulp');
var ts = require('gulp-typescript');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var shell = require('gulp-shell')

gulp.task('build:client', function () {
    var tsProject = ts.createProject(path.resolve('./src/tsconfig.json'));
    var tsResult = gulp.src([
        'src/**/*.ts'
    ])
        .pipe(sourcemaps.init())
        .pipe(tsProject())
    return tsResult.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.resolve('./out')))
});

gulp.task('watch:client', ['build:client'], function () {
	gulp.watch('src/**/*.ts', ['build:client']);
});

gulp.task('build', ['watch:client']);

gulp.task('default', ['build']);