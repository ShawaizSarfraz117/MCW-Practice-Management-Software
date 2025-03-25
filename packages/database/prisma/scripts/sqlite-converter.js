#!/usr/bin/env node
// complete-sqlite-converter.js - Single file to handle all SQL Server to SQLite schema conversion

const fs = require('fs');
const path = require('path');

/**
 * Complete SQL Server to SQLite Schema Converter
 * Handles conversion of Prisma schema from SQL Server to SQLite format
 */
class SQLServerToSQLiteConverter {
  constructor(options = {}) {
    this.options = {
      inputSchema: options.inputSchema || './prisma/schema.prisma',
      outputSchema: options.outputSchema || './prisma/schema-sqlite.prisma',
      sqlServerProvider: options.sqlServerProvider || 'sqlserver',
      sqliteProvider: options.sqliteProvider || 'sqlite',
      sqliteUrl: options.sqliteUrl || 'file:./dev.db',
      verbose: options.verbose !== undefined ? options.verbose : true,
      ...options
    };
  }

  /**
   * Log a message if verbose option is enabled
   */
  log(message) {
    if (this.options.verbose) {
      console.log(`[Schema Converter] ${message}`);
    }
  }

  /**
   * Fix any composite ID issues in SQLite
   * SQLite doesn't support named map attributes in @@id
   */
  fixCompositePrimaryKeys(schemaContent) {
    let result = schemaContent;
    
    // Find and fix ClientGroupMembership and any other composite ID issues
    const compositeIdRegex = /@@id\(\[([^\]]+)\](,\s*map:\s*"[^"]+")?\)/g;
    result = result.replace(compositeIdRegex, '@@id([$1])');
    
    return result;
  }

  /**
   * Run the complete conversion process
   */
  convert() {
    try {
      this.log(`Reading schema from ${this.options.inputSchema}`);
      
      if (!fs.existsSync(this.options.inputSchema)) {
        throw new Error(`Input schema file not found: ${this.options.inputSchema}`);
      }
      
      const schemaContent = fs.readFileSync(this.options.inputSchema, 'utf8');
      
      // Run all conversion steps
      let convertedSchema = schemaContent;
      convertedSchema = this.convertDatasource(convertedSchema);
      convertedSchema = this.convertDataTypes(convertedSchema);
      convertedSchema = this.removeNamedConstraints(convertedSchema);
      convertedSchema = this.removeMapFromDefault(convertedSchema);
      convertedSchema = this.removeMapFromId(convertedSchema);
      convertedSchema = this.convertRelations(convertedSchema);
      convertedSchema = this.convertUniqueIdentifierToUuid(convertedSchema);
      convertedSchema = this.fixCompositePrimaryKeys(convertedSchema);
      
      // Final cleanup - perform multiple passes to catch any remaining issues
      // This helps with nested or complex cases
      for (let i = 0; i < 3; i++) {
        convertedSchema = this.removeMapFromDefault(convertedSchema);
        convertedSchema = this.removeMapFromId(convertedSchema);
        convertedSchema = this.convertRelations(convertedSchema);
        convertedSchema = this.fixCompositePrimaryKeys(convertedSchema);
      }
      
      // Write the converted schema
      this.log(`Writing SQLite schema to ${this.options.outputSchema}`);
      
      // Ensure output directory exists
      const outputDir = path.dirname(this.options.outputSchema);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(this.options.outputSchema, convertedSchema, 'utf8');
      
      this.log('Schema conversion completed successfully');
      return true;
    } catch (error) {
      console.error('Error converting schema:', error);
      return false;
    }
  }

  /**
   * Convert the datasource block to use SQLite
   */
  convertDatasource(schemaContent) {
    // Find the datasource block
    const datasourceRegex = /datasource\s+db\s+{([^}]*)}/s;
    const datasourceMatch = schemaContent.match(datasourceRegex);
    
    if (!datasourceMatch) {
      throw new Error('Could not find datasource block in schema');
    }
    
    const datasourceBlock = datasourceMatch[0];
    
    // Create a new datasource block for SQLite
    const sqliteDatasource = `datasource db {
  provider = "${this.options.sqliteProvider}"
  url      = "${this.options.sqliteUrl}"
}`;
    
    // Replace the datasource block
    return schemaContent.replace(datasourceBlock, sqliteDatasource);
  }

  /**
   * Convert SQL Server specific data types to SQLite compatible ones
   */
  convertDataTypes(schemaContent) {
    let updatedSchema = schemaContent;
    
    // Replace all database-specific type annotations
    const typeReplacements = [
      // String types
      { from: /@db\.String(\(\d+\))?/g, to: '' },
      { from: /@db\.NVarChar(\(\d+\))?/g, to: '' },
      { from: /@db\.VarChar(\(\d+\))?/g, to: '' },
      { from: /@db\.Char(\(\d+\))?/g, to: '' },
      { from: /@db\.NChar(\(\d+\))?/g, to: '' },
      { from: /@db\.Text/g, to: '' },
      { from: /@db\.NText/g, to: '' },
      
      // Date/Time types
      { from: /@db\.DateTime/g, to: '' },
      { from: /@db\.DateTime2(\(\d+\))?/g, to: '' },
      { from: /@db\.SmallDateTime/g, to: '' },
      { from: /@db\.Date/g, to: '' },
      { from: /@db\.Time(\(\d+\))?/g, to: '' },
      { from: /@db\.DateTimeOffset(\(\d+\))?/g, to: '' },
      
      // Numeric types
      { from: /@db\.Decimal(\(\d+,\s*\d+\))?/g, to: '' },
      { from: /@db\.Money/g, to: '' },
      { from: /@db\.SmallMoney/g, to: '' },
      { from: /@db\.Float/g, to: '' },
      { from: /@db\.Real/g, to: '' },
      
      // Binary types
      { from: /@db\.Binary(\(\d+\))?/g, to: '' },
      { from: /@db\.VarBinary(\(\d+\))?/g, to: '' },
      { from: /@db\.Image/g, to: '' },
      
      // Boolean type
      { from: /@db\.Bit/g, to: '' },
      
      // Other types
      { from: /@db\.UniqueIdentifier/g, to: '' },
      { from: /@db\.Xml/g, to: '' },
      { from: /@db\.HierarchyId/g, to: '' },
    ];
    
    for (const { from, to } of typeReplacements) {
      updatedSchema = updatedSchema.replace(from, to);
    }
    
    return updatedSchema;
  }

  /**
   * Remove named constraints (map: "...") from the schema
   */
  removeNamedConstraints(schemaContent) {
    // Remove named unique constraints
    let result = schemaContent.replace(/@@unique\(\[[^\]]+\](,\s*map:\s*"[^"]+")?\)/g, match => {
      return match.replace(/, map: "[^"]+"/, '');
    });
    
    // Remove named index constraints
    result = result.replace(/@@index\(\[[^\]]+\](,\s*map:\s*"[^"]+")?\)/g, match => {
      return match.replace(/, map: "[^"]+"/, '');
    });
    
    return result;
  }

  /**
   * Remove map attributes from @default directives
   */
  removeMapFromDefault(schemaContent) {
    // This regex matches @default(..., map: "...") and removes the map part completely
    let result = schemaContent;
    
    // Remove @default with map attribute for now() - simplify to just @default(now())
    result = result.replace(/@default\(now\(\)(,\s*map:\s*"[^"]+")?\)/g, '@default(now())');
    
    // Remove @default with map attribute for boolean values - keep the boolean value
    result = result.replace(/@default\((true|false)(,\s*map:\s*"[^"]+")?\)/g, '@default($1)');
    
    // Remove @default with map attribute for dbgenerated - convert to uuid()
    result = result.replace(/@default\(dbgenerated\("newid\(\)"\)(,\s*map:\s*"[^"]+")?\)/g, '@default(uuid())');
    
    // Handle any remaining cases where map: is with other values
    result = result.replace(/@default\(([^,\)]*)(,\s*map:\s*"[^"]+")([^)]*)\)/g, '@default($1$3)');
    
    // Also handle the case where map: is the first parameter
    result = result.replace(/@default\(map:\s*"[^"]+"\s*(,\s*)?([^)]*)\)/g, '@default($2)');
    
    // Handle any remaining map attributes (including ones without commas)
    result = result.replace(/@default\(([^)]*)\s+map:\s*"[^"]+"\s*\)/g, '@default($1)');
    
    return result;
  }

  /**
   * Remove map attributes from @id directives and composite IDs
   */
  removeMapFromId(schemaContent) {
    // Remove map attribute from simple @id directives
    let result = schemaContent.replace(/@id\(map:\s*"[^"]+"\)/g, '@id');
    
    // Remove map attribute from composite ID (@@id) directives
    result = result.replace(/@@id\(\[([^\]]+)\](,\s*map:\s*"[^"]+")?\)/g, match => {
      return match.replace(/, map: "[^"]+"/, '');
    });
    
    return result;
  }

  /**
   * Convert @relation attributes to remove SQL Server specific parts
   */
  convertRelations(schemaContent) {
    // Remove named foreign keys (map: "...") from @relation
    let result = schemaContent.replace(/@relation\(([^)]*)(,\s*map:\s*"[^"]+")([^)]*)\)/g, '@relation($1$3)');
    
    // Remove onDelete: NoAction and onUpdate: NoAction (they're defaults in SQLite)
    result = result.replace(/(,\s*onDelete:\s*NoAction|,\s*onUpdate:\s*NoAction)/g, '');
    
    // Clean up empty @relation() or @relation() with trailing commas
    result = result.replace(/@relation\(\s*,\s*\)/g, '@relation()');
    result = result.replace(/@relation\(([^)]*),\s*\)/g, '@relation($1)');
    
    return result;
  }

  /**
   * Convert UniqueIdentifier fields with dbgenerated("newid()") to use uuid()
   */
  convertUniqueIdentifierToUuid(schemaContent) {
    // Replace all forms of dbgenerated("newid()") in @default directives with uuid()
    // This handles both ID fields and regular fields
    let result = schemaContent.replace(/@default\(dbgenerated\("newid\(\)"\)(,[^)]*)?/g, '@default(uuid()');
    
    // Also handle any that might have map attribute first
    result = result.replace(/@default\(map:[^,]*,\s*dbgenerated\("newid\(\)"\)/g, '@default(uuid()');
    
    return result;
  }

  /**
   * Apply the schema to the database
   */
  async applySchema() {
    try {
      this.log(`Applying schema ${this.options.outputSchema} to database...`);
      
      const { execSync } = require('child_process');
      const command = `npx prisma db push --schema=${this.options.outputSchema}`;
      
      this.log(`Running: ${command}`);
      execSync(command, { stdio: 'inherit' });
      
      this.log('Schema applied successfully');
      return true;
    } catch (error) {
      console.error('Error applying schema:', error);
      return false;
    }
  }
}

/**
 * Validate the generated schema by checking for common errors
 */
function validateSchema(schemaPath) {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Check for remaining map attributes
    const mapErrors = [];
    
    // Check for map in @default
    const defaultMapRegex = /@default\([^)]*map:/g;
    if (defaultMapRegex.test(schema)) {
      mapErrors.push('Found map attributes in @default directives');
    }
    
    // Check for map in @id
    const idMapRegex = /@id\([^)]*map:/g;
    if (idMapRegex.test(schema)) {
      mapErrors.push('Found map attributes in @id directives');
    }
    
    // Check for map in @@id
    const compositeIdMapRegex = /@@id\([^)]*map:/g;
    if (compositeIdMapRegex.test(schema)) {
      mapErrors.push('Found map attributes in @@id directives');
    }
    
    // Check for @db.String or other DB-specific types
    const dbTypeRegex = /@db\.\w+/g;
    if (dbTypeRegex.test(schema)) {
      mapErrors.push('Found @db type annotations which are not supported in SQLite');
    }
    
    return {
      valid: mapErrors.length === 0,
      errors: mapErrors
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Error reading schema: ${error.message}`]
    };
  }
}

/**
 * Main function to run the conversion
 */
async function main() {
  console.log('===== SQL Server to SQLite Schema Converter =====');
  
  const converter = new SQLServerToSQLiteConverter({
    inputSchema: './prisma/schema.prisma', 
    outputSchema: './prisma/schema-sqlite.prisma',
    sqliteUrl: 'file:./dev.db',
    verbose: true
  });
  
  // Convert the schema
  const conversionSuccess = converter.convert();
  if (!conversionSuccess) {
    console.error('❌ Schema conversion failed');
    process.exit(1);
  }
  
  console.log('✅ SQLite schema generated successfully at ./prisma/schema-sqlite.prisma');
  
  // Validate the generated schema
  const validation = validateSchema(converter.options.outputSchema);
  if (!validation.valid) {
    console.warn('⚠️ Warning: The generated schema may have issues:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
    console.warn('You may need to manually fix these issues before applying the schema.');
  }
  
  // Optionally apply the schema
  console.log('\nWould you like to apply this schema to your SQLite database? (y/n)');
  process.stdin.once('data', async (data) => {
    const input = data.toString().trim().toLowerCase();
    if (input === 'y' || input === 'yes') {
      const applySuccess = await converter.applySchema();
      if (applySuccess) {
        console.log('✅ Schema applied successfully to SQLite database');
      } else {
        console.error('❌ Failed to apply schema');
        process.exit(1);
      }
    }
    
    console.log('\nNext steps:');
    console.log('1. Run migrations: npx prisma migrate dev --name your-migration-name');
    console.log('2. Generate Prisma client: npx prisma generate');
    
    process.exit(0);
  });
}

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { SQLServerToSQLiteConverter };