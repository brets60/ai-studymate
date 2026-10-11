import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const JAVA_EXE = "C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\java.exe";
const GRADLE_HOME = "C:\\Users\\Saidimar Rey\\.gradle\\wrapper\\dists\\gradle-8.11.1-bin\\bpt9gzteqjrbo1mjrsomdt32c\\gradle-8.11.1";
const GRADLE_JAR = path.join(GRADLE_HOME, 'lib', 'gradle-gradle-cli-main-8.11.1.jar');
const ANDROID_SDK = "C:\\Users\\Saidimar Rey\\AppData\\Local\\Android\\Sdk";
const androidDir = path.resolve('android');

console.log("Java exists:", fs.existsSync(JAVA_EXE));
console.log("Gradle JAR exists:", fs.existsSync(GRADLE_JAR));
console.log("SDK exists:", fs.existsSync(ANDROID_SDK));

const args = [
  '-Xmx2048m',
  '-Dfile.encoding=UTF-8',
  '-Dorg.gradle.appname=gradle',
  `-javaagent:${GRADLE_HOME}/lib/agents/gradle-instrumentation-agent-8.11.1.jar`,
  '-classpath',
  GRADLE_JAR,
  'org.gradle.launcher.GradleMain',
  'assembleDebug',
  '--stacktrace'
];

console.log("Spawning Java directly with GradleMain (assembleDebug)...");

const env = {
  ...process.env,
  JAVA_HOME: "C:\\Program Files\\Android\\Android Studio\\jbr",
  ANDROID_HOME: ANDROID_SDK,
  ANDROID_SDK_ROOT: ANDROID_SDK
};

const child = spawn(JAVA_EXE, args, {
  cwd: androidDir,
  env,
  shell: false
});

child.stdout.on('data', (d) => process.stdout.write(d.toString()));
child.stderr.on('data', (d) => process.stderr.write(d.toString()));

child.on('close', (code) => {
  console.log(`\nProcess exited with code: ${code}`);
  if (code === 0) {
    const apkSrc = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    console.log("Checking output APK:", apkSrc, fs.existsSync(apkSrc));
    if (fs.existsSync(apkSrc)) {
      const publicApk = path.resolve('public', 'ai-studymate.apk');
      fs.copyFileSync(apkSrc, publicApk);
      const stats = fs.statSync(publicApk);
      console.log(`Successfully copied APK to ${publicApk} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  }
  process.exit(code);
});
