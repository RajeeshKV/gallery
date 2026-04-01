import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  authenticateAdmin,
  fetchFolderMetadata,
  fetchPortfolioAssets,
  saveFolderMetadata,
} from "../../lib/api";
import {
  clearAdminSession,
  isAdminAuthenticated,
  persistAdminSession,
  readStoredAdminSecret,
} from "../../lib/adminAuth";
import type {
  FolderConfig,
  PortfolioAsset,
  PortfolioResponse,
} from "../../types/portfolio";

type FolderName = "Carousel" | "Gallery";

type EditableItem = {
  publicId: string;
  title: string;
  alt: string;
  description: string;
};

type FolderState = {
  items: EditableItem[];
  isSaving: boolean;
  message: string | null;
};

const EMPTY_FOLDER_STATE: FolderState = {
  items: [],
  isSaving: false,
  message: null,
};

function toEditableItems(
  assets: PortfolioAsset[],
  metadata: FolderConfig,
): EditableItem[] {
  return assets.map((asset) => {
    const baseName = asset.publicId.split("/").pop() ?? asset.publicId;
    const item = metadata.entries[baseName];

    return {
      publicId: baseName,
      title: item?.name ?? asset.title,
      alt: asset.alt,
      description: item?.description ?? asset.description,
    };
  });
}

function buildMetadata(folder: FolderName, items: EditableItem[]): FolderConfig {
  return {
    folder,
    updatedAt: new Date().toISOString(),
    entries: Object.fromEntries(
      items.map((item) => [
        item.publicId,
        {
          name: item.title.trim(),
          ...(item.description.trim()
            ? { description: item.description.trim() }
            : {}),
        },
      ]),
    ),
  };
}

export function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => readStoredAdminSecret());
  const [isAuthed, setIsAuthed] = useState(() => isAdminAuthenticated());
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [assets, setAssets] = useState<PortfolioResponse | null>(null);
  const [folders, setFolders] = useState<Record<FolderName, FolderState>>({
    Carousel: EMPTY_FOLDER_STATE,
    Gallery: EMPTY_FOLDER_STATE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [portfolio, carouselMetadata, galleryMetadata] = await Promise.all([
          fetchPortfolioAssets(controller.signal),
          fetchFolderMetadata("Carousel", controller.signal),
          fetchFolderMetadata("Gallery", controller.signal),
        ]);

        if (!active) {
          return;
        }

        setAssets(portfolio);
        setFolders({
          Carousel: {
            items: toEditableItems(portfolio.carousel, carouselMetadata),
            isSaving: false,
            message: null,
          },
          Gallery: {
            items: toEditableItems(portfolio.gallery, galleryMetadata),
            isSaving: false,
            message: null,
          },
        });
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Cloudinary assets.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isAuthed]);

  const folderCounts = useMemo(
    () => ({
      Carousel: assets?.carousel.length ?? 0,
      Gallery: assets?.gallery.length ?? 0,
    }),
    [assets],
  );

  const updateField = (
    folder: FolderName,
    index: number,
    field: keyof EditableItem,
    value: string,
  ) => {
    setFolders((current) => ({
      ...current,
      [folder]: {
        ...current[folder],
        items: current[folder].items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  };

  const handleSave = async (folder: FolderName) => {
    setFolders((current) => ({
      ...current,
      [folder]: {
        ...current[folder],
        isSaving: true,
        message: null,
      },
    }));

    try {
      await saveFolderMetadata(folder, adminKey, buildMetadata(folder, folders[folder].items));
      setFolders((current) => ({
        ...current,
        [folder]: {
          ...current[folder],
          isSaving: false,
          message: "Saved to Cloudinary config.json",
        },
      }));
    } catch (saveError) {
      setFolders((current) => ({
        ...current,
        [folder]: {
          ...current[folder],
          isSaving: false,
          message:
            saveError instanceof Error
              ? saveError.message
              : "Unable to save metadata.",
        },
      }));
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setIsCheckingAuth(true);

    try {
      await authenticateAdmin(adminKey);
      persistAdminSession(adminKey);
      setIsAuthed(true);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Unable to authenticate.",
      );
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsAuthed(false);
    setAdminKey("");
    setAuthError(null);
  };

  if (!isAuthed) {
    return (
      <main className="admin-auth-page">
        <section className="admin-auth-card">
          <p className="eyebrow">RAW FRAMES GALLERY</p>
          <h1>Admin Panel</h1>
          <p>
            Enter the admin password to open the Cloudinary config editor at
            `/admin`.
          </p>

          <form className="admin-auth-form" onSubmit={handleLogin}>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                placeholder="Enter admin password"
                autoFocus
              />
            </label>

            {authError && <p className="admin-error">{authError}</p>}

            <button type="submit" disabled={isCheckingAuth}>
              {isCheckingAuth ? "Checking..." : "Open Admin"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <p className="eyebrow">RAW FRAMES GALLERY</p>
        <h1>Cloudinary Admin</h1>
        <p>
          Update carousel and gallery names from the `config.json` stored inside
          each Cloudinary folder. Description is optional, and the public UI reads
          these values on every fresh fetch.
        </p>
      </section>

      <section className="admin-toolbar">
        <label>
          <span>Session Password</span>
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Authenticated"
          />
        </label>
        <div className="admin-toolbar__actions">
          <a href="/">Back to gallery</a>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {isLoading && (
        <div className="admin-grid">
          {Array.from({ length: 2 }, (_, index) => (
            <section className="admin-card admin-card--loading" key={index}>
              <div className="admin-skeleton admin-skeleton--title" />
              <div className="admin-skeleton" />
              <div className="admin-skeleton" />
              <div className="admin-skeleton" />
            </section>
          ))}
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}

      {!isLoading && !error && (
        <div className="admin-grid">
          {(["Carousel", "Gallery"] as FolderName[]).map((folder) => (
            <section className="admin-card" key={folder}>
              <header className="admin-card__header">
                <div>
                  <p className="eyebrow">{folder}</p>
                  <h2>{folderCounts[folder]} assets</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSave(folder)}
                  disabled={folders[folder].isSaving}
                >
                  {folders[folder].isSaving ? "Saving..." : "Save config.json"}
                </button>
              </header>

              <div className="admin-list">
                {folders[folder].items.map((item, index) => (
                  <article className="admin-item" key={item.publicId}>
                    <p className="admin-item__id">{item.publicId}</p>
                    <label>
                      <span>Name</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          updateField(folder, index, "title", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Image Name</span>
                      <input
                        type="text"
                        value={item.alt}
                        readOnly
                      />
                    </label>
                    <label>
                      <span>Description</span>
                      <textarea
                        rows={3}
                        value={item.description}
                        onChange={(event) =>
                          updateField(folder, index, "description", event.target.value)
                        }
                      />
                    </label>
                  </article>
                ))}
              </div>

              {folders[folder].message && (
                <p className="admin-message">{folders[folder].message}</p>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
