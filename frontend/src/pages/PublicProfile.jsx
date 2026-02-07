import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";

export default function PublicProfile() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!username) {
      return;
    }

    api
      .getPublicProfile(username)
      .then((response) => {
        setData(response);
        setStatus("");
      })
      .catch((error) => {
        setStatus(error.message);
        setData(null);
      });
  }, [username]);

  if (!username) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1>Probio</h1>
          <p className="subtitle">
            Um link na bio premium para profissionais autônomos e lojas que vendem pelo WhatsApp.
          </p>
          <div className="card">
            <p>
              Acesse uma página pública digitando o nome de usuário na URL. Exemplo:
            </p>
            <code>https://seusite.com/joana-doces</code>
            <p className="muted">
              Ou crie sua conta para editar sua própria página profissional.
            </p>
            <Link to="/register" className="primary">
              Criar minha página
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (status) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1>Perfil não encontrado</h1>
          <p className="error">{status}</p>
          <Link to="/" className="primary">
            Voltar
          </Link>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section">
        <div className="container narrow">
          <p>Carregando perfil...</p>
        </div>
      </section>
    );
  }

  const { profile, links, portfolio } = data;
  const whatsappUrl = profile.whatsapp_number
    ? `https://wa.me/${profile.whatsapp_number}?text=${encodeURIComponent(
        profile.whatsapp_message || "Olá! Vi seu Probio e quero saber mais."
      )}`
    : "";

  return (
    <section className="section">
      <div className="container narrow">
        <div className="public-card">
          {profile.photo_url ? (
            <img className="avatar" src={profile.photo_url} alt={profile.name || "Foto"} />
          ) : (
            <div className="avatar placeholder">Foto</div>
          )}
          <h1>{profile.name || profile.username}</h1>
          <p className="subtitle">{profile.profession}</p>
          <p className="bio">{profile.bio}</p>

          {profile.whatsapp_enabled && whatsappUrl && (
            <a className="whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
              Falar no WhatsApp
            </a>
          )}

          <div className="links">
            {links.length === 0 ? (
              <p className="muted">Links em breve.</p>
            ) : (
              links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="link-item">
                  {link.title}
                </a>
              ))
            )}
          </div>

          <div className="portfolio">
            <h2>Portfólio</h2>
            {portfolio.length === 0 ? (
              <p className="muted">Itens do portfólio serão exibidos aqui.</p>
            ) : (
              <div className="portfolio-grid">
                {portfolio.map((item) => (
                  <div key={item.title} className="portfolio-item">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.title} />
                    )}
                    <div>
                      <h3>{item.title}</h3>
                      {item.link_url && (
                        <a href={item.link_url} target="_blank" rel="noreferrer">
                          Ver mais
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
