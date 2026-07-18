type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="placeholder-page">
      <span>قريبًا</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  )
}
