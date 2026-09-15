/** @type {import('jest').Config} */
module.exports = {
   testEnvironment: 'node',
   roots: ['<rootDir>/src'],
   testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
   moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
   },
   transform: {
      '^.+\\.tsx?$': [
         'ts-jest',
         {
            diagnostics: false,
            tsconfig: {
               module: 'commonjs',
               moduleResolution: 'node',
               esModuleInterop: true,
               target: 'es2019',
               jsx: 'react-jsx'
            }
         }
      ]
   }
}
