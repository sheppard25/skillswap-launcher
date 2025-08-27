from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        print(dir(p))

if __name__ == "__main__":
    main()
