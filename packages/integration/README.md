# Integration Testing Guide

This package provides tools for creating and running integration tests for Mimic Protocol WebAssembly tasks. Tests verify that your tasks interact correctly with the environment by mocking external calls and validating outputs.

## Test Structure

Each test follows a standardized directory structure:

```
tests/
├── XXX-test-name/        # Numbered test directory (e.g., 001-init-intent)
│   ├── src/              
│   │   └── task.ts       # Assemblyscript task implementation
│   ├── manifest.yaml     # Task manifest with metadata
│   ├── mock.json         # Mock configuration for environment functions
│   └── expected.log      # Expected output log for validation
```

## Creating a New Test

Follow these steps to create a new integration test:

1. Create a new directory in `tests/` following the naming convention: `XXX-test-name` where:
   - XXX is a sequential number (e.g., 007)
   - test-name describes the test purpose using hyphens

2. Add required files:

### src/task.ts

Implement your task that will be compiled to WebAssembly:

```typescript
import { Address, BigInt, Bytes, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'

export default function main(): void {
  // Your task implementation that calls environment functions
}
```

### manifest.yaml

Define task metadata:

```yaml
version: 1.0.0
name: Your Task Name
description: Brief description of what this task tests
```

### mock.json

Configure mock responses for environment function calls. You can use:

1. Simple logging: `"functionName": "log"`
2. Fixed response: `"functionName": "responseValue"`
3. Parameterized response:
```json
"functionName": {
  "paramResponse": {
    "param1": "response1",
    "param2": "response2"
  },
  "default": "defaultResponse",
  "log": true
}
```

Example:
```json
{
  "_call": "log",
  "_getPrice": {
    "paramResponse": {
      "ETH": "1500000000000000000000",
      "BTC": "60000000000000000000000"
    },
    "default": "0",
    "log": true
  }
}
```

### expected.log

Contains the expected output logs that will be compared against the actual logs generated during test execution:

```
_call: 0x0000000000000000000000000000000000000000,1,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0,0x00000000
_getPrice: 0x0000000000000000000000000000000000000000,1
```

## Running Tests

Integration tests run automatically as part of the test suite:

```bash
yarn test
```

The test runner:
1. Compiles each task to WebAssembly
2. Executes the task with the provided mocks
3. Compares actual output logs with expected logs
4. Reports any discrepancies

## Mock Response Types

The `MockRunner` supports several types of mock responses:

1. **Log-only**: Records the function call and parameters:
   ```json
   { "functionName": "log" }
   ```

2. **Constant response**: Always returns the same value:
   ```json
   { "functionName": "constant value" }
   ```

3. **Parameterized response**: Returns different values based on input parameters:
   ```json
   {
     "functionName": {
       "paramResponse": {
         "param1": "response1",
         "param2": "response2"
       },
       "default": "defaultValue",
       "log": true
     }
   }
   ```

With parameterized responses:
- `paramResponse`: Maps input parameters to specific responses
- `default`: Used when the parameter doesn't match any in `paramResponse`
- `log`: Whether to log the function call (optional) 