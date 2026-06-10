import * as fs from 'fs'
import * as path from 'path'

const logPath = '/Users/jaas/.gemini/antigravity-ide/brain/9422850c-4d1b-41fc-806e-77155bb82918/.system_generated/logs/transcript.jsonl'

async function run() {
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist at:', logPath)
    return
  }

  const lines = fs.readFileSync(logPath, 'utf8').split('\n')
  let lastWriteCode: string | null = null

  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const step = JSON.parse(line)
      if (step.tool_calls && Array.isArray(step.tool_calls)) {
        for (const call of step.tool_calls) {
          if (call.name === 'write_to_file') {
            const args = typeof call.args === 'string' ? JSON.parse(call.args) : call.args
            const target = args.TargetFile || args.targetFile
            if (target && target.includes('admin/actions/tasks.ts')) {
              lastWriteCode = args.CodeContent || args.codeContent
            }
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  if (lastWriteCode) {
    console.log('--- Last Written Code Found! Length:', lastWriteCode.length)
    let code = lastWriteCode

    // Since it's stored inside JSON as double-escaped, let's parse it
    if (code.startsWith('"')) {
      try {
        code = JSON.parse(code)
      } catch (e) {
        code = code.substring(1, code.length - 1)
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      }
    } else {
      try {
        code = JSON.parse('"' + code + '"')
      } catch (e) {
        code = code.replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      }
    }

    const outputPath = path.join(process.cwd(), 'src/app/admin/actions/tasks.ts')
    fs.writeFileSync(outputPath, code, 'utf8')
    console.log('Successfully recovered and parsed admin/actions/tasks.ts!')
  } else {
    console.log('Could not find write_to_file call for admin/actions/tasks.ts in logs.')
  }
}

run().catch(console.error)
