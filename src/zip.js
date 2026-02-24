import gulp from 'gulp'
import zip from 'gulp-zip'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

gulp
  .src('build/**')
  .pipe(zip(`${packageJson.name}-v${packageJson.version}.zip`))
  .pipe(gulp.dest('package'))
