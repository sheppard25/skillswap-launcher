from playwright.sync_api import sync_playwright, expect

def main():
    with sync_playwright() as p:
        # Corrected attribute from '_electron' to 'electron'
        app = p.electron.launch(args=['.'])

        # Wait for the first window to open.
        page = app.first_window()

        # Perform verifications to ensure the app loaded correctly.
        expect(page).to_have_title("SpaceGravure")
        expect(page.locator('h1')).to_have_text('SpaceGravure')

        # Take a screenshot for visual confirmation.
        page.screenshot(path="jules-scratch/verification/verification.png")

        # Close the app.
        app.close()

if __name__ == "__main__":
    main()
