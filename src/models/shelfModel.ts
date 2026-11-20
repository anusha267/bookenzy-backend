import sql from "../config/database";

export type ShelfStatus = "want" | "reading" | "finished";

export interface ShelfItem {
  id: string;
  title: string;
  author: string;
  status: ShelfStatus;
  rating: number;
  coverId: number | null;
  pages: number | null;
  year: number | null;
  currentPage: number;
  finishedAt: string | null;
}

const toItem = (r: Record<string, any>): ShelfItem => ({
  id: r.item_id,
  title: r.title,
  author: r.author,
  status: r.status,
  rating: r.rating,
  coverId: r.cover_id,
  pages: r.pages,
  year: r.year,
  currentPage: r.current_page,
  finishedAt: r.finished_at ? new Date(r.finished_at).toISOString() : null,
});

export const listShelf = async (userId: string) =>
  (await sql`SELECT * FROM shelf_items WHERE user_id = ${userId} ORDER BY created_at`).map(toItem);

export const addShelfItem = async (
  userId: string,
  i: { title: string; author: string; status: ShelfStatus; rating: number; coverId?: number; pages?: number; year?: number }
) => {
  const rows = await sql`INSERT INTO shelf_items (user_id, title, author, status, rating, cover_id, pages, year)
    VALUES (${userId}, ${i.title}, ${i.author}, ${i.status}, ${i.rating}, ${i.coverId ?? null}, ${i.pages ?? null}, ${i.year ?? null})
    RETURNING *`;
  return toItem(rows[0]);
};

export const updateShelfItem = async (userId: string, id: string, p: { status?: ShelfStatus; rating?: number; currentPage?: number }) => {
  // finished_at is set when an item first becomes 'finished' and cleared if it moves back.
  const rows = await sql`UPDATE shelf_items
    SET finished_at = CASE
          WHEN ${p.status ?? null}::text = 'finished' AND status <> 'finished' THEN now()
          WHEN ${p.status ?? null}::text IS NOT NULL AND ${p.status ?? null}::text <> 'finished' THEN NULL
          ELSE finished_at END,
        status = COALESCE(${p.status ?? null}::text, status),
        rating = COALESCE(${p.rating ?? null}::int, rating),
        current_page = COALESCE(${p.currentPage ?? null}::int, current_page),
        updated_at = now()
    WHERE item_id = ${id} AND user_id = ${userId} RETURNING *`;
  return rows.length ? toItem(rows[0]) : null;
};

export const deleteShelfItem = async (userId: string, id: string) =>
  (await sql`DELETE FROM shelf_items WHERE item_id = ${id} AND user_id = ${userId} RETURNING item_id`).length > 0;
