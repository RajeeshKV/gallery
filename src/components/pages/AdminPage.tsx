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

const PAGE_SIZE = 10;

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
  const [activeFolder, setActiveFolder] = useState<FolderName>("Carousel");
  const [assets, setAssets] = useState<PortfolioResponse | null>(null);
  const [folders, setFolders] = useState<Record<FolderName, FolderState>>({
    Carousel: EMPTY_FOLDER_STATE,
    Gallery: EMPTY_FOLDER_STATE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadAdminData = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    const [portfolio, carouselMetadata, galleryMetadata] = await Promise.all([
      fetchPortfolioAssets(signal),
      fetchFolderMetadata("Carousel", signal),
      fetchFolderMetadata("Gallery", signal),
    ]);

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
    setCurrentPage(1);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuthed) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        await loadAdminData(controller.signal);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load media assets.",
        );
        setIsLoading(false);
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

  const activeItems = folders[activeFolder].items;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const paginatedItems = activeItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
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
          message: "Saved configuration successfully.",
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

  const handleRefresh = async () => {
    try {
      await loadAdminData();
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to refresh configuration.",
      );
      setIsLoading(false);
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
          <p className="eyebrow">ARCHIVE</p>
          <h1>Admin Panel</h1>
          <p>
            Enter the admin password to open the configuration editor at `/admin`.
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
        <p className="eyebrow">ARCHIVE</p>
        <h1>Admin</h1>
        <p>
          Update carousel and gallery names from the folder configuration.
          Description is optional, and the public UI reads these values on every fresh fetch.
        </p>
      </section>

      <section className="admin-toolbar">
        <label className="admin-toolbar__folder">
          <span>Folder</span>
          <select
            value={activeFolder}
            onChange={(event) => {
              setActiveFolder(event.target.value as FolderName);
              setCurrentPage(1);
            }}
          >
            <option value="Carousel">Carousel</option>
            <option value="Gallery">Gallery</option>
          </select>
        </label>
        <div className="admin-toolbar__actions">
          <button type="button" onClick={() => void handleRefresh()}>
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleSave(activeFolder)}
            disabled={folders[activeFolder].isSaving || isLoading}
          >
            {folders[activeFolder].isSaving ? "Saving..." : "Save config.json"}
          </button>
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
          <section className="admin-card" key={activeFolder}>
            <header className="admin-card__header">
              <div>
                <p className="eyebrow">{activeFolder}</p>
                <h2>{folderCounts[activeFolder]} assets</h2>
              </div>
              <div className="admin-pagination">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                <span>
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </header>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, index) => {
                    const absoluteIndex = (currentPage - 1) * PAGE_SIZE + index;

                    return (
                      <tr key={item.publicId}>
                        <td>
                          <input type="text" value={item.publicId} readOnly />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(event) =>
                              updateField(
                                activeFolder,
                                absoluteIndex,
                                "title",
                                event.target.value,
                              )
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(event) =>
                              updateField(
                                activeFolder,
                                absoluteIndex,
                                "description",
                                event.target.value,
                              )
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {folders[activeFolder].message && (
              <p className="admin-message">{folders[activeFolder].message}</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
