import fs from 'fs/promises';
import path from 'path';

async function generateToeicLevels() {
  const toeicDir = path.join(process.cwd(), 'content', 'toeic');
  const files = await fs.readdir(toeicDir);

  const passageFiles = files.filter(file => file.endsWith('.md') && !file.includes('_level'));

  for (const fileName of passageFiles) {
    const fullPath = path.join(toeicDir, fileName);
    const originalContent = await fs.readFile(fullPath, 'utf-8');
    const passageId = fileName.replace('.md', '');

    console.log(`Processing ${fileName}...`);

    for (const targetLevel of [1, 2]) {
      console(`  Generating Level ${targetLevel}...`);
      try {
        const response = await fetch('http://localhost:3000/api/rewrite-level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalText: originalContent,
            targetLevel: targetLevel,
            title: `TOEIC Passage ${passageId.replace('passage', '')} Level ${targetLevel}`,
            currentLevel: 3 // 元のレベルは3と仮定
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} - ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        const rewrittenText = data.rewrittenText;

        if (rewrittenText) {
          const newFileName = `${passageId}_level${targetLevel}.md`;
          const newFilePath = path.join(toeicDir, newFileName);
          await fs.writeFile(newFilePath, rewrittenText, 'utf-8');
          console.log(`  ✅ Saved ${newFileName}`);
        } else {
          console.warn(`  ⚠️ No rewritten text returned for Level ${targetLevel}`);
        }
      } catch (error) {
        console.error(`  ❌ Error generating Level ${targetLevel} for ${fileName}:`, error);
      }
    }
  }
  console.log('All TOEIC level generations completed.');
}

generateToeicLevels();
