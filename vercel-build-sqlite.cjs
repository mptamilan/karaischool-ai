
const fs = require('fs');
const path = require('path');

if (process.env.VERCEL) {
  const source = '/vercel/layered/node_modules/sqlite3/build';
  const destination = path.join(process.cwd(), 'node_modules/sqlite3/build');

  if (fs.existsSync(source)) {
    fs.mkdirSync(destination, { recursive: true });
    fs.readdirSync(source).forEach(file => {
      fs.copyFileSync(path.join(source, file), path.join(destination, file));
    });
    console.log('Successfully copied sqlite3 bindings for Vercel.');
  } else {
    console.error('Could not find pre-built sqlite3 bindings for Vercel.');
    process.exit(1);
  }
}
