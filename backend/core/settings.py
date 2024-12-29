import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Backup settings
if os.name == 'nt':  # Windows
    default_backup_path = os.path.join(os.getenv('USERPROFILE') or 'C:', 'TaskManager_Backups')
else:  # Unix/Linux
    default_backup_path = os.path.join(BASE_DIR, 'backups')

BACKUP_ROOT = os.getenv('BACKUP_ROOT', default_backup_path)

# Ensure backup directory exists and is writable
try:
    os.makedirs(BACKUP_ROOT, exist_ok=True)
    test_file = os.path.join(BACKUP_ROOT, 'test_write')
    with open(test_file, 'w') as f:
        f.write('test')
    os.remove(test_file)
except Exception as e:
    print(f"Warning: Could not create/write to backup directory {BACKUP_ROOT}: {e}")
    # Fallback to a directory we know we can write to
    BACKUP_ROOT = os.path.join(BASE_DIR, 'backups')
    os.makedirs(BACKUP_ROOT, exist_ok=True)

BACKUP_EXCLUDE_APPS = ['contenttypes', 'auth.permission']
BACKUP_FILENAME_PREFIX = 'backup' 