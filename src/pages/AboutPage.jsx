import { useAsync, getStats, useLang } from '../utils/data';
import { formatNumber } from '../utils/helpers';
import Loading from '../components/Loading';

export default function AboutPage() {
  const { lang } = useLang();
  const { data: stats, loading } = useAsync(getStats);

  if (loading) return <Loading />;

  const t = translations[lang];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 dark:text-sand-50 mb-4">
          tabakat<span className="text-gold-600">.io</span>
        </h1>
        <p className="text-lg text-ink-600 dark:text-sand-300 max-w-2xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            { label: t.scholars, value: stats.total_scholars },
            { label: t.relations, value: stats.total_edges },
            { label: t.mapped, value: stats.geocoded },
            { label: t.books, value: 435 },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-sand-100">
                {formatNumber(s.value)}
              </p>
              <p className="text-xs text-ink-500 dark:text-sand-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-10">
        {/* About */}
        <Section title={t.aboutTitle}>
          <p>{t.aboutText1}</p>
          <p>{t.aboutText2}</p>
        </Section>

        {/* Data Sources */}
        <Section title={t.sourcesTitle}>
          <ul className="space-y-2">
            {t.sourcesList.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gold-500 mt-1 shrink-0">▪</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Methodology */}
        <Section title={t.methodTitle}>
          <p>{t.methodText1}</p>
          <p>{t.methodText2}</p>
        </Section>

        {/* Citation */}
        <Section title={t.citationTitle}>
          <div className="bg-sand-100 dark:bg-ink-800 rounded-xl p-5 font-mono text-sm text-ink-700 dark:text-sand-300 leading-relaxed">
            {t.citation}
          </div>
        </Section>

        {/* Team */}
        <Section title={t.teamTitle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PersonCard
              name="Dr. Hüseyin Gökalp"
              role={lang === 'tr' ? 'İlahiyat Fakültesi, Selçuk Üniversitesi' : 'Faculty of Theology, Selçuk University'}
              orcid="0000-0002-7747-6854"
            />
            <PersonCard
              name="Dr. Ali Çetinkaya"
              role={lang === 'tr' ? 'Bilgisayar Mühendisliği, Selçuk Üniversitesi' : 'Computer Engineering, Selçuk University'}
            />
          </div>
        </Section>

        {/* License */}
        <Section title={t.licenseTitle}>
          <p>{t.licenseText}</p>
        </Section>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-sand-200 dark:border-ink-700 text-center">
        <p className="text-sm text-ink-500 dark:text-sand-400">
          tabakat.io — v7.0 · Selçuk Üniversitesi · 2026
        </p>
        <p className="text-xs text-ink-400 dark:text-sand-500 mt-2">
          <a href="https://github.com/alicetinkaya76/tabakat-io" target="_blank" rel="noopener noreferrer" className="hover:text-gold-600 transition-colors">
            GitHub ↗
          </a>
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-sand-100 mb-4">{title}</h2>
      <div className="text-ink-700 dark:text-sand-300 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function PersonCard({ name, role, orcid }) {
  return (
    <div className="card p-5">
      <p className="font-display text-lg font-semibold text-ink-900 dark:text-sand-100">{name}</p>
      <p className="text-sm text-ink-600 dark:text-sand-400 mt-1">{role}</p>
      {orcid && (
        <a
          href={`https://orcid.org/${orcid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-teal-700 dark:text-teal-400 hover:text-teal-900 mt-2 transition-colors"
        >
          ORCID: {orcid} ↗
        </a>
      )}
    </div>
  );
}

const translations = {
  tr: {
    subtitle: 'İslam medeniyetinin en kapsamlı dijital âlimler atlası. 23.000\'den fazla âlimin biyografileri, ilişki ağları, eğitim rotaları ve silsile zincirleri — tek bir platformda.',
    scholars: 'Âlim',
    relations: 'İlişki',
    mapped: 'Haritada',
    books: 'Tabakat Kitabı',
    aboutTitle: 'Proje Hakkında',
    aboutText1: 'tabakat.io, İslam medeniyetinin entelektüel tarihini dijital yöntemlerle haritalandırmayı amaçlayan açık kaynaklı bir araştırma projesidir. Proje, klasik tabakat (biyografi) geleneğindeki bilgileri yapılandırılmış veriye dönüştürerek araştırmacılara yeni analiz imkânları sunmaktadır.',
    aboutText2: 'Platform; âlimlerin coğrafi dağılımını, hoca-talebe ilişkilerini, mezhep ve alan dağılımlarını, eğitim rotalarını ve silsile zincirlerini interaktif görselleştirmeler aracılığıyla sunmaktadır.',
    sourcesTitle: 'Veri Kaynakları',
    sourcesList: [
      'TDV İslam Ansiklopedisi (DİA) — 8.500+ âlim biyografisi',
      'Ziriklî, el-Aʿlâm — 13.940 biyografik kayıt',
      'OpenITI Corpus — 435 tabakat kitabından yapılandırılmış veri',
      'EI1 (Encyclopaedia of Islam, 1st ed.) — ek biyografiler',
      'al-Ṯurayyā — tarihî coğrafi koordinatlar',
    ],
    methodTitle: 'Metodoloji',
    methodText1: 'Veri toplama sürecinde yarı-otomatik bir NLP boru hattı kullanılmıştır. Biyografik metinlerden âlim bilgileri (isim, vefat, alan, mezhep, ilişkiler) çıkarılmış; çapraz kaynak doğrulaması ile veri kalitesi artırılmıştır.',
    methodText2: 'Coğrafi kodlama için al-Ṯurayyā ve modern GIS kaynakları birleştirilmiştir. İlişki ağları, kaynaklardaki hoca-talebe, muasır ve çapraz atıf bilgilerinden oluşturulmuştur.',
    citationTitle: 'Atıf',
    citation: 'Gökalp, H. & Çetinkaya, A. (2026). tabakat.io: İslam Âlimleri Dijital Atlası. Selçuk Üniversitesi. https://tabakat.io',
    teamTitle: 'Ekip',
    licenseTitle: 'Lisans',
    licenseText: 'tabakat.io açık kaynaklı bir projedir. Veriler CC-BY-SA 4.0, kod MIT lisansı altında sunulmaktadır. Akademik kullanımda atıf zorunludur.',
  },
  en: {
    subtitle: 'The most comprehensive digital atlas of Islamic civilization scholars. Biographies, relationship networks, education routes, and chains of transmission of over 23,000 scholars — in one platform.',
    scholars: 'Scholars',
    relations: 'Relations',
    mapped: 'Mapped',
    books: 'Tabaqāt Books',
    aboutTitle: 'About the Project',
    aboutText1: 'tabakat.io is an open-source research project that maps the intellectual history of Islamic civilization using digital methods. The project transforms information from the classical tabaqāt (biographical) tradition into structured data, offering researchers new analytical possibilities.',
    aboutText2: 'The platform presents the geographical distribution of scholars, teacher-student relationships, sectarian and field distributions, education routes, and chains of transmission through interactive visualizations.',
    sourcesTitle: 'Data Sources',
    sourcesList: [
      'TDV İslam Ansiklopedisi (DİA) — 8,500+ scholar biographies',
      'al-Ziriklī, al-Aʿlām — 13,940 biographical records',
      'OpenITI Corpus — structured data from 435 tabaqāt books',
      'EI1 (Encyclopaedia of Islam, 1st ed.) — additional biographies',
      'al-Ṯurayyā — historical geographical coordinates',
    ],
    methodTitle: 'Methodology',
    methodText1: 'A semi-automated NLP pipeline was used for data collection. Scholar information (name, death date, field, school, relationships) was extracted from biographical texts; cross-source validation improved data quality.',
    methodText2: 'Geographical coding combined al-Ṯurayyā with modern GIS sources. Relationship networks were constructed from teacher-student, contemporary, and cross-reference information in the sources.',
    citationTitle: 'Citation',
    citation: 'Gökalp, H. & Çetinkaya, A. (2026). tabakat.io: Digital Atlas of Islamic Scholars. Selçuk University. https://tabakat.io',
    teamTitle: 'Team',
    licenseTitle: 'License',
    licenseText: 'tabakat.io is an open-source project. Data is available under CC-BY-SA 4.0, code under the MIT license. Citation is required for academic use.',
  },
};
