import { execSync } from "child_process";

const gradle = "C:\\Users\\Saidimar Rey\\.gradle\\wrapper\\dists\\gradle-8.11.1-bin\\bpt9gzteqjrbo1mjrsomdt32c\\gradle-8.11.1\\bin\\gradle.bat";
const env = { ...process.env, JAVA_HOME: "C:\\Program Files\\Android\\Android Studio\\jbr" };

try {
  const out = execSync(`"${gradle}" -v`, { env, encoding: "utf-8" });
  console.log(out.slice(0, 300));
} catch (e) {
  console.error("Gradle error:", e.message);
}
