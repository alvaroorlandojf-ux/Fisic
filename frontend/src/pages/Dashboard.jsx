import { useEffect, useState } from "react";
import { api } from "../api";

const emptyProfile = {
  username: "",
  name: "",
  profession: "",
  bio: "",
  photo_url: "",
  whatsapp_number: "",
  whatsapp_message: "",
  whatsapp_enabled: true,
};

export default function Dashboard() {
  const [profile, setProfile] = useState(emptyProfile);
  const [links, setLinks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [status, setStatus] = useState("");
  const [linkForm, setLinkForm] = useState({ title: "", url: "" });
  const [portfolioForm, setPortfolioForm] = useState({ title: "", image_url: "", link_url: "" });

  const loadData = async () => {
    try {
      const user = await api.getMe();
      const linkData = await api.listLinks();
      const portfolioData = await api.listPortfolio();
      setProfile({
        username: user.username || "",
        name: user.name || "",
        profession: user.profession || "",
        bio: user.bio || "",
        photo_url: user.photo_url || "",
        whatsapp_number: user.whatsapp_number || "",
        whatsapp_message: user.whatsapp_message || "",
        whatsapp_enabled: Boolean(user.whatsapp_enabled),
      });
      setLinks(linkData);
      setPortfolio(portfolioData);
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setStatus("");

    try {
      await api.updateProfile(profile);
      setStatus("Perfil atualizado com sucesso!");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLinkSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.createLink(linkForm);
      setLinkForm({ title: "", url: "" });
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLinkUpdate = async (linkId, updates) => {
    try {
      await api.updateLink(linkId, updates);
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLinkDelete = async (linkId) => {
    try {
      await api.deleteLink(linkId);
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const moveLink = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= links.length) {
      return;
    }

    const reordered = [...links];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    setLinks(reordered);
    await api.reorderLinks(reordered.map((link) => link.id));
  };

  const handlePortfolioSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.createPortfolio(portfolioForm);
      setPortfolioForm({ title: "", image_url: "", link_url: "" });
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handlePortfolioDelete = async (itemId) => {
    try {
      await api.deletePortfolio(itemId);
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Seu painel</h1>
            <p className="subtitle">Edite sua vitrine profissional e deixe o WhatsApp em destaque.</p>
          </div>
          <div className="card preview">
            <p className="label">Sua página pública</p>
            <p className="preview-link">/{profile.username || "seu-usuario"}</p>
          </div>
        </div>

        {status && <p className="status">{status}</p>}

        <div className="grid">
          <div className="card">
            <h2>Dados básicos</h2>
            <form className="form" onSubmit={handleProfileSubmit}>
              <label className="label">
                Nome de usuário (URL)
                <input
                  value={profile.username}
                  onChange={(event) => setProfile({ ...profile, username: event.target.value })}
                  placeholder="maria-cakes"
                />
              </label>
              <label className="label">
                Nome
                <input
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  placeholder="Maria Souza"
                />
              </label>
              <label className="label">
                Profissão
                <input
                  value={profile.profession}
                  onChange={(event) => setProfile({ ...profile, profession: event.target.value })}
                  placeholder="Boleira artesanal"
                />
              </label>
              <label className="label">
                Bio curta
                <textarea
                  rows="3"
                  value={profile.bio}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                  placeholder="Conte em poucas palavras o que você faz."
                />
              </label>
              <label className="label">
                Foto de perfil (URL)
                <input
                  value={profile.photo_url}
                  onChange={(event) => setProfile({ ...profile, photo_url: event.target.value })}
                  placeholder="https://..."
                />
              </label>

              <div className="divider" />

              <h3>WhatsApp</h3>
              <label className="label">
                Número com DDD
                <input
                  value={profile.whatsapp_number}
                  onChange={(event) => setProfile({ ...profile, whatsapp_number: event.target.value })}
                  placeholder="5511999999999"
                />
              </label>
              <label className="label">
                Mensagem padrão
                <input
                  value={profile.whatsapp_message}
                  onChange={(event) => setProfile({ ...profile, whatsapp_message: event.target.value })}
                  placeholder="Olá! Vi seu Probio e quero saber mais."
                />
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={profile.whatsapp_enabled}
                  onChange={(event) => setProfile({ ...profile, whatsapp_enabled: event.target.checked })}
                />
                Ativar botão de WhatsApp na página pública
              </label>
              <button className="primary" type="submit">Salvar alterações</button>
            </form>
          </div>

          <div className="stack">
            <div className="card">
              <h2>Links</h2>
              <form className="form inline" onSubmit={handleLinkSubmit}>
                <input
                  value={linkForm.title}
                  onChange={(event) => setLinkForm({ ...linkForm, title: event.target.value })}
                  placeholder="Título do link"
                  required
                />
                <input
                  value={linkForm.url}
                  onChange={(event) => setLinkForm({ ...linkForm, url: event.target.value })}
                  placeholder="https://"
                  required
                />
                <button className="secondary" type="submit">Adicionar</button>
              </form>
              <ul className="list">
                {links.map((link, index) => (
                  <li key={link.id} className="list-item">
                    <div>
                      <input
                        className="small"
                        value={link.title}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item) =>
                              item.id === link.id ? { ...item, title: event.target.value } : item
                            )
                          )
                        }
                      />
                      <input
                        className="small"
                        value={link.url}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((item) =>
                              item.id === link.id ? { ...item, url: event.target.value } : item
                            )
                          )
                        }
                      />
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => handleLinkUpdate(link.id, { title: link.title, url: link.url })}
                      >
                        Salvar
                      </button>
                      <button type="button" className="ghost" onClick={() => moveLink(index, -1)}>
                        ↑
                      </button>
                      <button type="button" className="ghost" onClick={() => moveLink(index, 1)}>
                        ↓
                      </button>
                      <button type="button" className="ghost danger" onClick={() => handleLinkDelete(link.id)}>
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2>Portfólio</h2>
              <form className="form inline" onSubmit={handlePortfolioSubmit}>
                <input
                  value={portfolioForm.title}
                  onChange={(event) => setPortfolioForm({ ...portfolioForm, title: event.target.value })}
                  placeholder="Título do trabalho"
                  required
                />
                <input
                  value={portfolioForm.image_url}
                  onChange={(event) => setPortfolioForm({ ...portfolioForm, image_url: event.target.value })}
                  placeholder="Imagem (URL)"
                />
                <input
                  value={portfolioForm.link_url}
                  onChange={(event) => setPortfolioForm({ ...portfolioForm, link_url: event.target.value })}
                  placeholder="Link (opcional)"
                />
                <button className="secondary" type="submit">Adicionar</button>
              </form>
              <ul className="list">
                {portfolio.map((item) => (
                  <li key={item.id} className="list-item">
                    <div>
                      <strong>{item.title}</strong>
                      {item.image_url && <p className="muted">Imagem: {item.image_url}</p>}
                      {item.link_url && <p className="muted">Link: {item.link_url}</p>}
                    </div>
                    <button
                      type="button"
                      className="ghost danger"
                      onClick={() => handlePortfolioDelete(item.id)}
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
