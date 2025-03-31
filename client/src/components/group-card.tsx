
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"

export function GroupCard({ group }) {
  const navigate = useNavigate();

  return (
    <Card className="w-[300px]">
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
        <Button onClick={() => navigate(`/group/${group.id}`)}>
          Accéder au groupe
        </Button>
      </CardContent>
    </Card>
  )
}
