
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { BirthdayForm } from "../components/birthday-form"

export function GroupPage() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [birthdays, setBirthdays] = useState([])

  useEffect(() => {
    // Charger les données du groupe
    fetch(`/api/groups/${id}`).then(res => res.json()).then(setGroup)
    // Charger les anniversaires
    fetch(`/api/groups/${id}/birthdays`).then(res => res.json()).then(setBirthdays)
  }, [id])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{group?.name}</h1>
      
      <div className="mb-8">
        <h2 className="text-xl mb-4">Ajouter un anniversaire</h2>
        <BirthdayForm groupId={id} onSuccess={() => {
          // Recharger les anniversaires
          fetch(`/api/groups/${id}/birthdays`).then(res => res.json()).then(setBirthdays)
        }} />
      </div>

      <div>
        <h2 className="text-xl mb-4">Anniversaires</h2>
        <div className="grid gap-4">
          {birthdays.map(birthday => (
            <div key={birthday.id} className="p-4 border rounded">
              <p>{birthday.name} - {new Date(birthday.birthdate).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
