import { execSync } from 'node:child_process';

try {
  console.log(execSync('git init').toString());
  // Set git user info if not already set
  try { execSync('git config user.name "AI StudyMate Developer"'); } catch {}
  try { execSync('git config user.email "developer@studymate.ai"'); } catch {}
  console.log(execSync('git add .').toString());
  console.log(execSync('git commit -m "feat: AI StudyMate standalone production setup"').toString());
  console.log("Git repo created and committed!");
} catch (e) {
  console.error("Git error:", e.message);
  if (e.stdout) console.log("Stdout:", e.stdout.toString());
  if (e.stderr) console.log("Stderr:", e.stderr.toString());
}
