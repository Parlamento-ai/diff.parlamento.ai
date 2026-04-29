/**
 * The active schema version for the research experiment.
 *
 * The build script and the demo app import from THIS file only — never
 * directly from v1-schema.ts / v2-schema.ts. To bump the schema, change
 * the line below and update the YAML corpus to match.
 */

export * from './v3-schema';
