#!/bin/bash
set -e

echo "📦 Packaging Lambda functions..."
echo ""

# Array of function directories
functions=("get-author" "get-authors-by-letter" "search-autocomplete")

# Create output directory for zip files
OUTPUT_DIR="$(dirname "$0")/dist"
mkdir -p "$OUTPUT_DIR"

# Package each function
for func in "${functions[@]}"; do
  echo "📦 Packaging $func..."
  cd "$func"

  # Install dependencies
  echo "  Installing dependencies..."
  npm install --production --silent

  # Create zip package
  echo "  Creating zip package..."
  zip -qr "../dist/${func}.zip" . -x "*.git*" "*.DS_Store" "package-lock.json" "README.md"

  # Clean up
  echo "  Cleaning up..."
  rm -rf node_modules

  cd ..

  # Get file size
  SIZE=$(du -h "dist/${func}.zip" | cut -f1)
  echo "  ✅ $func packaged as ${func}.zip ($SIZE)"
  echo ""
done

echo "✨ All Lambda functions packaged successfully!"
echo ""
echo "📋 Package Summary:"
ls -lh dist/*.zip
echo ""
echo "📤 Next steps:"
echo "   Upload zip files to AWS Lambda manually via AWS Console or CLI:"
echo ""
echo "   # Via AWS CLI:"
echo "   aws lambda update-function-code --function-name get-author \\"
echo "     --zip-file fileb://dist/get-author.zip"
echo ""
echo "   aws lambda update-function-code --function-name get-authors-by-letter \\"
echo "     --zip-file fileb://dist/get-authors-by-letter.zip"
echo ""
echo "   aws lambda update-function-code --function-name search-autocomplete \\"
echo "     --zip-file fileb://dist/search-autocomplete.zip"
echo ""
