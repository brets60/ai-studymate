import { execSync } from 'node:child_process';

try {
  console.log(execSync('git add .').toString());
  console.log(execSync('git commit -m "feat: configure Android app to permanent Vercel 24/7 cloud URL"').toString());
  console.log(execSync('git push origin main').toString());
  console.log("Successfully pushed to GitHub!");
} catch (e) {
  console.error("Push error:", e.message);
  if (e.stdout) console.log(e.stdout.toString());
  if (e.stderr) console.log(e.stderr.toString());
}
