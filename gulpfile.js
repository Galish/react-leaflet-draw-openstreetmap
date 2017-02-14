const babelify = require('babelify')
const browserify = require('browserify')
const connect = require('gulp-connect')
const csso = require('gulp-csso')
const gulp = require('gulp')
const gutil = require('gulp-util')
const sass = require('gulp-sass');
const source = require('vinyl-source-stream')
const sourcemaps = require('gulp-sourcemaps')
const streamify = require('gulp-streamify')
const uglify = require('gulp-uglify')

gulp.task('build', () => {
	const result = browserify({
		entries: './assets/js/main.js',
		extensions: ['.js'],
		debug: true
	})
	.transform('babelify', {
		presets: ['es2015', 'react'],
		plugins: ['transform-class-properties']
	})
	.bundle()
	.on('error', function(err){
		gutil.log(gutil.colors.red.bold('[browserify error]'));
		gutil.log(err.message);
		this.emit('end');
	})
	.pipe(source('app.js'))

	if (process.env.NODE_ENV === 'production') {
		result.pipe(streamify(uglify()))
	}

	result.pipe(gulp.dest('./'))
		.pipe(connect.reload())

	process.env.NODE_ENV === 'production' && console.log('Build created!!!');
})

gulp.task('watch-js', function() {
	gulp.watch('./assets/js/*.js' , ['build'])
})

gulp.task('connect', function() {
	connect.server({
		livereload: true,
		port: 8820,
		root: './'
	})
})

gulp.task('watch-sass', function() {
	gulp.watch('./assets/sass/*.scss' , ['sass'])
})

gulp.task('sass', function() {
	const result = gulp.src('./assets/sass/main.scss')
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))

	if (process.env.NODE_ENV === 'development') {
		result.pipe(sourcemaps.write())
	}
	if (process.env.NODE_ENV === 'production') {
		result.pipe(csso())
	}
		//.pipe(gulp.dest('./css'));
		//.pipe(sass())
		// .pipe(autoprefixer({
		// 	browsers: ['> 5%'],
		// 	cascade: false
		// }))

	result.pipe(gulp.dest('./'))
		.pipe(connect.reload())
})

gulp.task('default', ['connect', 'watch-js', 'watch-sass', 'build', 'sass'])