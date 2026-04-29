// imports
const path = require('path');
const gulp = require('gulp');
const ignore = require('gulp-exclude-gitignore');
const clean = require('gulp-clean');
const filter = require('gulp-filter');
const uglify = require('gulp-uglify');


// distribution directory
const DIST_DIR = path.join(__dirname, 'dist');

/**
 * Cleans the distribution directory for new builds.
 */
gulp.task('clean', () => gulp.src(DIST_DIR, { read: false }).pipe(clean()));

/**
 * Obfuscate js sources and copy deployment files to distribution directory.
 */
gulp.task('build', () => {

    // js file filter
    const jsFilter = filter('**/*.js', { restore: true });

    // process files
    return gulp.src(['./**/*', '!gulpfile.js'])
        .pipe(ignore('./.gitignore')) // ignore files in .gitignore
        .pipe(jsFilter) // apply js files filter
        .pipe(uglify())
        .pipe(jsFilter.restore) // resume with non js files
        .pipe(gulp.dest(DIST_DIR)); // write to dist directory
});