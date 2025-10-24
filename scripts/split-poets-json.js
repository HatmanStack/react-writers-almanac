#!/usr/bin/env node

/**
 * Split poets.json into individual author files for S3 upload
 *
 * This script:
 * 1. Reads poets.json
 * 2. Creates individual author files: authors/by-name/{slug}.json
 * 3. Creates letter-grouped files: authors/by-letter/{A-Z}.json
 * 4. Validates all JSON output
 * 5. Generates a manifest file
 *
 * Output structure:
 * output/
 * ├── authors/
 * │   ├── by-name/
 * │   │   ├── a-a-milne.json
 * │   │   ├── billy-collins.json
 * │   │   └── ...
 * │   └── by-letter/
 * │       ├── A.json
 * │       ├── B.json
 * │       └── ...
 * └── manifest.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const POETS_JSON_PATH = path.join(__dirname, '..', 'poets.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const AUTHORS_BY_NAME_DIR = path.join(OUTPUT_DIR, 'authors', 'by-name');
const AUTHORS_BY_LETTER_DIR = path.join(OUTPUT_DIR, 'authors', 'by-letter');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

/**
 * Convert author name to slug format
 * @param {string} name - Author name (e.g., "Billy Collins")
 * @returns {string} Slug (e.g., "billy-collins")
 */
function nameToSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, '-')      // Replace spaces, underscores, dots with hyphens
    .replace(/[^\p{L}\p{N}-]/gu, '') // Keep Unicode letters, numbers, hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '');      // Trim leading/trailing hyphens
}

/**
 * Get first letter of author name (normalized to uppercase)
 * @param {string} name - Author name
 * @returns {string} First letter (A-Z)
 */
function getFirstLetter(name) {
  const firstChar = name.trim()[0].toUpperCase();
  // Return letter if A-Z, otherwise use '#' for numbers/special chars
  return /[A-Z]/.test(firstChar) ? firstChar : '#';
}

/**
 * Create directory if it doesn't exist
 * @param {string} dir - Directory path
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Write JSON file with validation
 * @param {string} filePath - File path
 * @param {any} data - Data to write
 */
function writeJSON(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  // Validate JSON by parsing it
  JSON.parse(json);
  fs.writeFileSync(filePath, json, 'utf8');
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Starting poets.json split process...\n');

  // Step 1: Read poets.json
  console.log('📖 Reading poets.json...');
  if (!fs.existsSync(POETS_JSON_PATH)) {
    console.error(`❌ Error: poets.json not found at ${POETS_JSON_PATH}`);
    process.exit(1);
  }

  const poetsData = JSON.parse(fs.readFileSync(POETS_JSON_PATH, 'utf8'));
  const authorNames = Object.keys(poetsData);
  console.log(`✅ Found ${authorNames.length} authors\n`);

  // Step 2: Create output directories
  console.log('📁 Creating output directories...');
  ensureDir(AUTHORS_BY_NAME_DIR);
  ensureDir(AUTHORS_BY_LETTER_DIR);
  console.log('✅ Directories created\n');

  // Step 3: Create individual author files
  console.log('✍️  Creating individual author files...');
  const authorsByLetter = {};
  const manifest = {
    totalAuthors: authorNames.length,
    generatedAt: new Date().toISOString(),
    authors: [],
  };

  let successCount = 0;
  let errorCount = 0;

  authorNames.forEach((authorName, index) => {
    try {
      const slug = nameToSlug(authorName);
      const letter = getFirstLetter(authorName);
      const authorData = poetsData[authorName];

      // Write individual author file
      const authorFilePath = path.join(AUTHORS_BY_NAME_DIR, `${slug}.json`);
      writeJSON(authorFilePath, authorData);

      // Group by letter
      if (!authorsByLetter[letter]) {
        authorsByLetter[letter] = [];
      }
      authorsByLetter[letter].push(authorName);

      // Add to manifest
      manifest.authors.push({
        name: authorName,
        slug: slug,
        letter: letter,
        file: `authors/by-name/${slug}.json`,
      });

      successCount++;

      // Progress indicator (every 10 authors)
      if ((index + 1) % 10 === 0) {
        console.log(`  Processed ${index + 1}/${authorNames.length} authors...`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${authorName}:`, error.message);
      errorCount++;
    }
  });

  console.log(`✅ Created ${successCount} author files`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} errors occurred\n`);
  } else {
    console.log('');
  }

  // Step 4: Create letter-grouped files
  console.log('🔤 Creating letter-grouped files...');
  const letters = Object.keys(authorsByLetter).sort();

  letters.forEach(letter => {
    const letterData = {
      letter: letter,
      authors: authorsByLetter[letter].sort(),
    };
    const letterFilePath = path.join(AUTHORS_BY_LETTER_DIR, `${letter}.json`);
    writeJSON(letterFilePath, letterData);
  });

  console.log(`✅ Created ${letters.length} letter files: ${letters.join(', ')}\n`);

  // Step 5: Generate manifest
  console.log('📋 Generating manifest...');
  manifest.letterFiles = letters.map(letter => `authors/by-letter/${letter}.json`);
  writeJSON(MANIFEST_PATH, manifest);
  console.log('✅ Manifest created\n');

  // Step 6: Summary
  console.log('📊 Summary:');
  console.log(`   Total authors: ${authorNames.length}`);
  console.log(`   Individual files: ${successCount}`);
  console.log(`   Letter groups: ${letters.length}`);
  console.log(`   Output directory: ${OUTPUT_DIR}`);
  console.log(`   Manifest: ${MANIFEST_PATH}`);
  console.log('');
  console.log('✨ Split process complete! Ready for S3 upload.\n');

  // Step 7: Next steps
  console.log('📤 Next steps:');
  console.log('   1. Review output files in ./output/');
  console.log('   2. Upload to S3:');
  console.log('      aws s3 sync ./output/authors/ s3://YOUR-BUCKET/authors/ \\');
  console.log('        --cache-control "public, max-age=31536000" \\');
  console.log('        --content-type "application/json"');
  console.log('');
}

// Run main function
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

module.exports = { nameToSlug, getFirstLetter };
