# Current Feature: Item Delete

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Delete button available on item (in drawer or card)
- Clicking delete opens a Shadcn AlertDialog for confirmation
- Confirming deletion triggers a server action to delete the item from the database
- On success, a toast notification is displayed
- Item is removed from the list/view after deletion
- Error handling: toast shown on failure

## Notes

<!-- Any extra notes -->

- Use Shadcn `AlertDialog` component for the confirmation dialog
- Use Shadcn `toast` / `useToast` or `sonner` (whichever is already in use in the project) for the success toast
- Server action should invalidate/revalidate the relevant cache after deletion

## History

<!-- Keep this updated. Earliest to latest -->
