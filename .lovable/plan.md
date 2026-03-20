

## Bank Statement Import: Replace vs Append Option

**Current behavior**: Reimporting the same statement will **duplicate all entries** — it always appends to existing days, never replaces.

**Proposed change**: Add a toggle in the import dialog letting you choose between **Replace** (clear existing entries for affected days before importing) and **Append** (current behavior).

### Plan

1. **Add a Replace/Append toggle to `BankStatementImportDialog.tsx`**
   - Add a new state `importMode: 'replace' | 'append'` (default: `replace` since that's the safer choice for reimports)
   - Render a radio group or select before the transaction list

2. **Update the import logic in the same file**
   - When `importMode === 'replace'`: before inserting entries for a given day, delete all existing `real_time_entries` where `day_id` matches that day
   - When `importMode === 'append'`: keep current behavior (find max sort_order, append after it)

3. **Update the alert text**
   - Change the warning message to reflect the selected mode:
     - Replace: "Existing entries on imported days will be **cleared and replaced**"
     - Append: "Existing days will have entries **appended**"

### Technical detail

The replace logic inserts a single delete call per day before inserting new entries:

```typescript
if (importMode === 'replace') {
  await supabase
    .from('real_time_entries')
    .delete()
    .eq('day_id', dayId);
}
```

This only affects days that appear in the imported statement. Days not in the statement remain untouched. Opening balances on existing days are preserved.

