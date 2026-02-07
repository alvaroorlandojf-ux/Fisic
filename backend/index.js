import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, initializeDatabase } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "probio_dev_secret";

initializeDatabase();

app.use(cors());
app.use(express.json());

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Token ausente" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

function defaultUsername(email) {
  return email.split("@")[0];
}

app.post("/api/auth/register", (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const finalUsername = username || defaultUsername(email);

  db.run(
    `INSERT INTO users (email, password_hash) VALUES (?, ?)`
    , [email, passwordHash],
    function insertUser(err) {
      if (err) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const userId = this.lastID;
      db.run(
        `INSERT INTO profiles (user_id, username, name, profession, bio, photo_url, whatsapp_number, whatsapp_message, whatsapp_enabled)
         VALUES (?, ?, '', '', '', '', '', '', 1)`
        , [userId, finalUsername],
        (profileErr) => {
          if (profileErr) {
            return res.status(400).json({ message: "Username indisponível" });
          }

          const token = createToken({ id: userId, email });
          return res.json({ token });
        }
      );
    }
  );
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = createToken(user);
    return res.json({ token });
  });
});

app.get("/api/me", authMiddleware, (req, res) => {
  db.get(
    `SELECT users.id, users.email, profiles.username, profiles.name, profiles.profession, profiles.bio,
            profiles.photo_url, profiles.whatsapp_number, profiles.whatsapp_message, profiles.whatsapp_enabled
     FROM users
     LEFT JOIN profiles ON profiles.user_id = users.id
     WHERE users.id = ?`,
    [req.user.id],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      return res.json(user);
    }
  );
});

app.put("/api/profile", authMiddleware, (req, res) => {
  const {
    username,
    name,
    profession,
    bio,
    photo_url,
    whatsapp_number,
    whatsapp_message,
    whatsapp_enabled,
  } = req.body;

  db.run(
    `UPDATE profiles
     SET username = ?, name = ?, profession = ?, bio = ?, photo_url = ?, whatsapp_number = ?, whatsapp_message = ?, whatsapp_enabled = ?
     WHERE user_id = ?`,
    [
      username,
      name,
      profession,
      bio,
      photo_url,
      whatsapp_number,
      whatsapp_message,
      whatsapp_enabled ? 1 : 0,
      req.user.id,
    ],
    function updateProfile(err) {
      if (err) {
        return res.status(400).json({ message: "Não foi possível atualizar o perfil" });
      }
      return res.json({ message: "Perfil atualizado" });
    }
  );
});

app.get("/api/links", authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM links WHERE user_id = ? ORDER BY sort_order ASC, id ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao buscar links" });
      }
      return res.json(rows);
    }
  );
});

app.post("/api/links", authMiddleware, (req, res) => {
  const { title, url } = req.body;

  if (!title || !url) {
    return res.status(400).json({ message: "Título e URL são obrigatórios" });
  }

  db.get(
    `SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM links WHERE user_id = ?`,
    [req.user.id],
    (err, row) => {
      const nextOrder = (row?.maxOrder || 0) + 1;
      db.run(
        `INSERT INTO links (user_id, title, url, sort_order) VALUES (?, ?, ?, ?)`
        , [req.user.id, title, url, nextOrder],
        function insertLink(error) {
          if (error) {
            return res.status(500).json({ message: "Erro ao criar link" });
          }
          return res.json({ id: this.lastID });
        }
      );
    }
  );
});

app.put("/api/links/:id", authMiddleware, (req, res) => {
  const { title, url } = req.body;
  const linkId = req.params.id;

  db.run(
    `UPDATE links SET title = ?, url = ? WHERE id = ? AND user_id = ?`,
    [title, url, linkId, req.user.id],
    function updateLink(err) {
      if (err || this.changes === 0) {
        return res.status(400).json({ message: "Link não encontrado" });
      }
      return res.json({ message: "Link atualizado" });
    }
  );
});

app.delete("/api/links/:id", authMiddleware, (req, res) => {
  const linkId = req.params.id;
  db.run(
    `DELETE FROM links WHERE id = ? AND user_id = ?`,
    [linkId, req.user.id],
    function deleteLink(err) {
      if (err || this.changes === 0) {
        return res.status(400).json({ message: "Link não encontrado" });
      }
      return res.json({ message: "Link removido" });
    }
  );
});

app.post("/api/links/reorder", authMiddleware, (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ message: "Lista inválida" });
  }

  const updates = orderedIds.map((id, index) =>
    new Promise((resolve, reject) => {
      db.run(
        `UPDATE links SET sort_order = ? WHERE id = ? AND user_id = ?`,
        [index + 1, id, req.user.id],
        function updateOrder(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    })
  );

  Promise.all(updates)
    .then(() => res.json({ message: "Ordem atualizada" }))
    .catch(() => res.status(500).json({ message: "Erro ao reordenar" }));
});

app.get("/api/portfolio", authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY id DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao buscar portfólio" });
      }
      return res.json(rows);
    }
  );
});

app.post("/api/portfolio", authMiddleware, (req, res) => {
  const { title, image_url, link_url } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Título é obrigatório" });
  }

  db.run(
    `INSERT INTO portfolio_items (user_id, title, image_url, link_url) VALUES (?, ?, ?, ?)`
    , [req.user.id, title, image_url || "", link_url || ""],
    function insertPortfolio(err) {
      if (err) {
        return res.status(500).json({ message: "Erro ao adicionar item" });
      }
      return res.json({ id: this.lastID });
    }
  );
});

app.delete("/api/portfolio/:id", authMiddleware, (req, res) => {
  const itemId = req.params.id;
  db.run(
    `DELETE FROM portfolio_items WHERE id = ? AND user_id = ?`,
    [itemId, req.user.id],
    function deletePortfolio(err) {
      if (err || this.changes === 0) {
        return res.status(400).json({ message: "Item não encontrado" });
      }
      return res.json({ message: "Item removido" });
    }
  );
});

app.get("/api/public/:username", (req, res) => {
  const { username } = req.params;

  db.get(
    `SELECT profiles.user_id, profiles.username, profiles.name, profiles.profession, profiles.bio,
            profiles.photo_url, profiles.whatsapp_number, profiles.whatsapp_message, profiles.whatsapp_enabled
     FROM profiles
     WHERE profiles.username = ?`,
    [username],
    (err, profile) => {
      if (err || !profile) {
        return res.status(404).json({ message: "Perfil não encontrado" });
      }

      db.all(
        `SELECT title, url FROM links WHERE user_id = ? ORDER BY sort_order ASC, id ASC`,
        [profile.user_id],
        (linksErr, links) => {
          if (linksErr) {
            return res.status(500).json({ message: "Erro ao buscar links" });
          }

          db.all(
            `SELECT title, image_url, link_url FROM portfolio_items WHERE user_id = ? ORDER BY id DESC`,
            [profile.user_id],
            (portfolioErr, portfolio) => {
              if (portfolioErr) {
                return res.status(500).json({ message: "Erro ao buscar portfólio" });
              }

              return res.json({
                profile,
                links,
                portfolio,
              });
            }
          );
        }
      );
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
