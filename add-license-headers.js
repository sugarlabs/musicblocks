/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Ashraf Mohamed
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Retrieves information about the given file from Git.
 * @param {string} filePath - The path to the file.
 * @returns {{year: number, author: string}} - The year and author of the most recent commit.
 */
/******  a2dcfcad-f5eb-4279-8696-b530959d08c3  *******/
function getGitInfo(filePath) {
  try {
    const gitLogCommand = `git log --follow --format="%ad|%an" --date=format:"%Y" --reverse "${filePath}"`;
    const gitLog = execSync(gitLogCommand, { encoding: 'utf8' }).trim();
    
    if (gitLog) {
      const firstLine = gitLog.split('\n')[0];
      const [year, author] = firstLine.split('|');
      return { year, author };
    }
  } catch (error) {
    console.error(`Error getting git info for ${filePath}: ${error.message}`);
  }
  
  return { year: new Date().getFullYear(), author: 'MusicBlocks Contributors' };
}

const licenseTemplate = `/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) $year $author
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */`;

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Adds a license header to a file, taking into account special handling
 * for certain files (SaveInterface.js, js/blocks/*.js, js/js-export/API/*)
 * @param {string} filePath - The path to the file
 */
/******  6134758f-292e-4d66-98cf-483ccebf2050  *******/
function addLicenseToFile(filePath) {
  if (filePath.includes('/tests/') || filePath.includes('\\tests\\')) {
    console.log(`Skipping test file: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('@license') || content.includes('* Copyright') || content.includes('// Copyright')) {
      console.log(`File already has license or copyright: ${filePath}`);
      return;
    }
    
    
    const { year, author } = getGitInfo(filePath);
    
    const licenseHeader = licenseTemplate
      .replace('$year', year)
      .replace('$author', author);
    
    if (
      filePath.includes('js/SaveInterface.js') || 
      filePath.includes('js\\SaveInterface.js') || 
      (filePath.includes('js/blocks/') && filePath.endsWith('.js')) ||
      (filePath.includes('js\\blocks\\') && filePath.endsWith('.js')) ||
      filePath.includes('js/js-export/API') ||
      filePath.includes('js\\js-export\\API')
    ) {
      console.log(`Special handling for file: ${filePath}`);
      const lines = content.split('\n');
      let commentEnd = 0;
      
      // Find the end of the existing comment block if any
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '*/') {
          commentEnd = i + 1;
          break;
        }
      }
      
      if (commentEnd > 0) {
        // There's an existing comment, insert license after it
        const beforeComment = lines.slice(0, commentEnd).join('\n');
        const afterComment = lines.slice(commentEnd).join('\n');
        content = beforeComment + '\n\n' + licenseHeader + '\n\n' + afterComment;
      } else {
        // No existing comment, just add license at the top
        content = licenseHeader + '\n\n' + content;
      }
    } else {
      // For regular files, just add license at the top
      content = licenseHeader + '\n\n' + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Added license to: ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
  }
}

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Recursively processes all files in a directory that match the given extensions.
 * Skips 'node_modules', 'test', and 'tests' directories.
 * 
 * @param {string} dirPath The path to the directory to process.
 * @param {string[]} [extensions=['.js']] The extensions of files to process.
 */
/******  c5e08a83-b862-4db4-9f87-f07fee824389  *******/
function processDirectory(dirPath, extensions = ['.js']) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and test directories
      if (file !== 'node_modules' && file !== 'test' && file !== 'tests') {
        processDirectory(filePath, extensions);
      }
    } else if (extensions.includes(path.extname(filePath))) {
      addLicenseToFile(filePath);
    }
  }
}

// Main function
function main() {
  const projectRoot = process.cwd(); // Current working directory
  console.log(`Processing project at: ${projectRoot}`);
  processDirectory(projectRoot, ['.js']);
  console.log('License header addition complete!');
}

main();