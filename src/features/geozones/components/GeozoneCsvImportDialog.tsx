import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, Download, FileUp } from "lucide-react"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useImportGeozones } from "@/data/hooks"
import {
  GEOZONE_CSV_TEMPLATE,
  downloadTextFile,
  parseGeozoneCsv,
} from "@/lib/csv"

export interface GeozoneCsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GeozoneCsvImportDialog({
  open,
  onOpenChange,
}: GeozoneCsvImportDialogProps) {
  const { t } = useTranslation()
  const [text, setText] = useState("")
  const importGeozones = useImportGeozones()

  useEffect(() => {
    if (!open) setText("")
  }, [open])

  const result = useMemo(
    () => (text.trim() ? parseGeozoneCsv(text) : { zones: [], errors: [] }),
    [text]
  )
  const hasInput = text.trim().length > 0
  const canImport = result.zones.length > 0

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const content = await file.text()
    setText(content)
  }

  const handleImport = () => {
    if (!canImport) return
    importGeozones.mutate(result.zones, {
      onSuccess: () => {
        toast.success(
          t("geozones.toast.imported", { count: result.zones.length })
        )
        onOpenChange(false)
      },
      onError: () => toast.error(t("geozones.toast.importFailed")),
    })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("geozones.csv.title")}
      description={t("geozones.csv.description")}
      submitLabel={
        canImport
          ? t("geozones.csv.importCount", { count: result.zones.length })
          : t("geozones.csv.importButton")
      }
      onSubmit={handleImport}
      isPending={importGeozones.isPending}
      disabled={!canImport}
      widthClass="sm:max-w-xl"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            downloadTextFile("geozone-template.csv", GEOZONE_CSV_TEMPLATE)
          }
        >
          <Download className="size-4" />
          {t("geozones.csv.downloadTemplate")}
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            <FileUp className="size-4" />
            {t("geozones.csv.chooseFile")}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                void handleFile(e.target.files?.[0])
                e.target.value = ""
              }}
            />
          </label>
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="csv-text">{t("geozones.csv.contentsLabel")}</Label>
        <Textarea
          id="csv-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"zone_name,lat,lng\nModjo Customs Yard,8.5832,39.1212"}
          className="min-h-32 font-mono text-xs"
        />
      </div>

      {hasInput ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t("geozones.csv.preview")}</span>
            <span className="text-muted-foreground tabular-nums">
              {t("geozones.csv.validZones", { count: result.zones.length })}
            </span>
          </div>

          {result.zones.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {result.zones.slice(0, 5).map((zone, index) => (
                <li
                  key={`${zone.name}-${index}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{zone.name}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {t("geozones.csv.pts", { count: zone.points.length })}
                  </span>
                </li>
              ))}
              {result.zones.length > 5 ? (
                <li className="text-xs text-muted-foreground">
                  {t("geozones.csv.moreZones", {
                    count: result.zones.length - 5,
                  })}
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("geozones.csv.noneFound")}
            </p>
          )}

          {result.errors.length > 0 ? (
            <div className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                {t("geozones.csv.issues", { count: result.errors.length })}
              </div>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 5 ? (
                  <li>
                    {t("geozones.csv.moreZones", {
                      count: result.errors.length - 5,
                    })}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </FormDialog>
  )
}
