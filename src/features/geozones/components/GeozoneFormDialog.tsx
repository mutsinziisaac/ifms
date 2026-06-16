import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Circle as CircleIcon, Hexagon } from "lucide-react"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateGeozone,
  useGeozoneGroups,
  useUpdateGeozone,
} from "@/data/hooks"
import type { GeozoneInput } from "@/data/api"
import type { Geozone, GeozoneShape, LatLng } from "@/data/types"
import { centroidOf } from "@/lib/maps"

export interface GeozoneDraft {
  shape: GeozoneShape
  center?: LatLng
  radiusM?: number
  path?: LatLng[]
}

export interface GeozoneFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  geozone?: Geozone
  /** Geometry produced by the page's DrawingManager (create-by-draw mode). */
  draft?: GeozoneDraft
}

const NO_GROUP = "__none__"
const DEFAULT_CENTER: LatLng = { lat: 9.6, lng: 40.8 }

export function GeozoneFormDialog({
  open,
  onOpenChange,
  geozone,
  draft,
}: GeozoneFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = geozone !== undefined

  const groups = useGeozoneGroups().data ?? []
  const createGeozone = useCreateGeozone()
  const updateGeozone = useUpdateGeozone()

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [shape, setShape] = useState<GeozoneShape>("circle")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [radiusM, setRadiusM] = useState("")
  const [groupId, setGroupId] = useState<string>(NO_GROUP)
  const [note, setNote] = useState("")
  // Polygon geometry only ever comes from a draw draft — kept out of inputs.
  const [polygonPath, setPolygonPath] = useState<LatLng[] | null>(null)

  // Seed the form when the dialog opens, from the edited zone, draw draft or
  // sensible defaults.
  useEffect(() => {
    if (!open) return

    if (geozone) {
      setName(geozone.name)
      setAddress(geozone.address)
      setShape(geozone.shape)
      setLat(geozone.center.lat.toFixed(5))
      setLng(geozone.center.lng.toFixed(5))
      setRadiusM(
        geozone.radiusM != null ? String(Math.round(geozone.radiusM)) : ""
      )
      setGroupId(geozone.groupId ?? NO_GROUP)
      setNote(geozone.note)
      setPolygonPath(geozone.shape === "polygon" ? geozone.path : null)
      return
    }

    if (draft) {
      setShape(draft.shape)
      if (draft.shape === "circle") {
        const center = draft.center ?? DEFAULT_CENTER
        setLat(center.lat.toFixed(5))
        setLng(center.lng.toFixed(5))
        setRadiusM(
          draft.radiusM != null ? String(Math.round(draft.radiusM)) : ""
        )
        setPolygonPath(null)
      } else {
        const path = draft.path ?? []
        const center = path.length > 0 ? centroidOf(path) : DEFAULT_CENTER
        setLat(center.lat.toFixed(5))
        setLng(center.lng.toFixed(5))
        setRadiusM("")
        setPolygonPath(path)
      }
      setName("")
      setAddress("")
      setGroupId(NO_GROUP)
      setNote("")
      return
    }

    // Manual create — default to a circle anchored on the corridor.
    setName("")
    setAddress("")
    setShape("circle")
    setLat(DEFAULT_CENTER.lat.toFixed(5))
    setLng(DEFAULT_CENTER.lng.toFixed(5))
    setRadiusM("500")
    setGroupId(NO_GROUP)
    setNote("")
    setPolygonPath(null)
  }, [open, geozone, draft])

  const isPolygon = shape === "polygon"
  const isDrawnGeometry = draft !== undefined || (isEdit && isPolygon)

  const buildInput = (): GeozoneInput | null => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error(t("geozones.toast.nameRequired"))
      return null
    }

    const resolvedGroupId = groupId === NO_GROUP ? null : groupId
    const base = {
      name: trimmedName,
      address: address.trim(),
      groupId: resolvedGroupId,
      note: note.trim(),
    }

    if (isPolygon) {
      if (!polygonPath || polygonPath.length < 3) {
        toast.error(t("geozones.toast.drawPolygonFirst"))
        return null
      }
      return {
        ...base,
        shape: "polygon",
        center: centroidOf(polygonPath),
        radiusM: null,
        path: polygonPath,
      }
    }

    const latNum = Number(lat)
    const lngNum = Number(lng)
    const radiusNum = Number(radiusM)
    if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
      toast.error(t("geozones.toast.invalidLatitude"))
      return null
    }
    if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.error(t("geozones.toast.invalidLongitude"))
      return null
    }
    if (!Number.isFinite(radiusNum) || radiusNum <= 0) {
      toast.error(t("geozones.toast.invalidRadius"))
      return null
    }
    return {
      ...base,
      shape: "circle",
      center: { lat: latNum, lng: lngNum },
      radiusM: Math.round(radiusNum),
      path: null,
    }
  }

  const handleSubmit = () => {
    const input = buildInput()
    if (!input) return

    if (isEdit && geozone) {
      updateGeozone.mutate(
        { id: geozone.id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("geozones.toast.updated"))
            onOpenChange(false)
          },
          onError: () => toast.error(t("geozones.toast.updateFailed")),
        }
      )
    } else {
      createGeozone.mutate(input, {
        onSuccess: () => {
          toast.success(t("geozones.toast.created"))
          onOpenChange(false)
        },
        onError: () => toast.error(t("geozones.toast.createFailed")),
      })
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit ? t("geozones.form.editTitle") : t("geozones.form.addTitle")
      }
      description={
        isPolygon && isDrawnGeometry
          ? t("geozones.form.drawnDescription")
          : t("geozones.form.circleDescription")
      }
      submitLabel={
        isEdit
          ? t("geozones.form.saveGeozone")
          : t("geozones.form.createGeozone")
      }
      onSubmit={handleSubmit}
      isPending={createGeozone.isPending || updateGeozone.isPending}
    >
      <div className="space-y-2">
        <Label htmlFor="geozone-name">{t("forms.name")}</Label>
        <Input
          id="geozone-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("geozones.form.namePlaceholder")}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="geozone-address">{t("forms.address")}</Label>
        <Input
          id="geozone-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("geozones.form.addressPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("geozones.form.shape")}</Label>
        {isDrawnGeometry ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            {isPolygon ? (
              <Hexagon className="size-4 text-muted-foreground" />
            ) : (
              <CircleIcon className="size-4 text-muted-foreground" />
            )}
            <span className="font-medium">{t(`geozones.shapes.${shape}`)}</span>
            <span className="text-muted-foreground">
              {isPolygon
                ? t("geozones.form.shapeVertices", {
                    count: polygonPath?.length ?? 0,
                  })
                : t("geozones.form.shapeFromMap")}
            </span>
          </div>
        ) : (
          <Select
            value={shape}
            onValueChange={(value) => setShape(value as GeozoneShape)}
            disabled={isEdit}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="circle">
                {t("geozones.form.circleOption")}
              </SelectItem>
              <SelectItem value="polygon" disabled>
                {t("geozones.form.polygonOption")}
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        {!isDrawnGeometry && !isEdit ? (
          <p className="text-xs text-muted-foreground">
            {t("geozones.form.polygonHint")}
          </p>
        ) : null}
      </div>

      {!isPolygon ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="geozone-lat">{t("geozones.form.latitude")}</Label>
            <Input
              id="geozone-lat"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="geozone-lng">{t("geozones.form.longitude")}</Label>
            <Input
              id="geozone-lng"
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="geozone-radius">{t("geozones.form.radius")}</Label>
            <Input
              id="geozone-radius"
              inputMode="numeric"
              value={radiusM}
              onChange={(e) => setRadiusM(e.target.value)}
              className="tabular-nums"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="geozone-group">{t("forms.group")}</Label>
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger id="geozone-group" className="w-full">
            <SelectValue placeholder={t("geozones.form.noGroup")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_GROUP}>
              {t("geozones.form.noGroup")}
            </SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="geozone-note">{t("forms.note")}</Label>
        <Textarea
          id="geozone-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("geozones.form.notePlaceholder")}
          rows={2}
        />
      </div>
    </FormDialog>
  )
}
