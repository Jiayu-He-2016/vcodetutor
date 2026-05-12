# Python Packages

Python packages add reusable tools so you do not have to write everything from scratch.

## Imports

`import` makes a module available:

```python
import json
from pathlib import Path
```

When explaining imports, identify what tool is being brought in and where it is used later.

## Common Packages

`json` reads and writes JSON data. `requests` sends HTTP requests. `os` and `pathlib` help with files, folders, and environment variables. `pandas` works with table-like data. `numpy` works with arrays and numeric calculations.

## Package Errors

If a package is missing, Python may raise `ModuleNotFoundError`. A beginner-friendly explanation should distinguish between code logic errors and environment/setup errors.

## APIs

Code like `requests.get(url)` usually contacts a web service. Explain what URL or input is being sent, what response comes back, and whether the response needs parsing such as `.json()`.

## Environment Variables

Secrets such as API keys should usually come from environment variables, not from code committed to a repository. In Python this often uses `os.environ` or a `.env` loader. Explain that the program reads a secret at runtime instead of hard-coding it.

## Reading Files

`open()` reads or writes files. A `with open(...) as file:` block is preferred because Python closes the file automatically after the block finishes. Explain the file path, mode such as `"r"` or `"w"`, and what data is read or written.

## JSON Data Flow

JSON usually moves through these steps:

1. Load raw text from a file or response.
2. Parse it into Python dictionaries or lists.
3. Read fields from those dictionaries or lists.
4. Optionally write updated data back as JSON.

When a highlighted line uses `json.load`, `json.loads`, or `response.json()`, explain that raw JSON is being turned into Python data.

## Package Aliases

Packages are sometimes imported with aliases:

```python
import pandas as pd
import numpy as np
```

When explaining highlighted code such as `pd.read_csv(...)`, connect the alias back to the imported package.
