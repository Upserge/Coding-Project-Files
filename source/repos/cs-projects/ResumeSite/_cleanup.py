with open('src/app/resume-service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove dead getTechIcon method (contains emojis that break tools)
idx = content.find('  // ===== Technology Icon Mapping =====')
if idx >= 0:
    # Find the closing brace of the class (last })
    end = content.rfind('}')
    # The getTechIcon block goes from idx to just before the last }
    # Find the } that closes getTechIcon
    tech_end = content.find('  }', idx)
    if tech_end >= 0:
        tech_end = content.find('\n', tech_end) + 1
        content = content[:idx] + content[tech_end:]
        print('Removed getTechIcon method')
    else:
        print('ERROR: could not find end of getTechIcon')
else:
    print('getTechIcon already removed')

# Remove PerformanceMonitor import
old_import = "import { PerformanceMonitor } from './performance-monitor';\n"
if old_import in content:
    content = content.replace(old_import, '')
    print('Removed PerformanceMonitor import')
else:
    print('PerformanceMonitor import not found, checking...')
    if 'performance-monitor' in content:
        print('  Still referenced somewhere!')
    else:
        print('  Already clean')

# Replace highlightAndScroll calls in keyboard shortcuts section
# (it was removed from service, callers in app.ts use scrollTo now)

with open('src/app/resume-service.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done with resume-service.ts cleanup')
