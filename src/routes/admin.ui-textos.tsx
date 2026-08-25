import {createFileRoute} from "@tanstack/react-router";
import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {supabase} from "@/integrations/supabase/client";
import {toast} from "sonner";
export const Route=createFileRoute("/admin/ui-textos")({component:Page});
function Page(){const[r,setR]=useState<any[]>([]);useEffect(()=>{void supabase.from("ui_textos").select("id,chave,valor,descricao").order("chave").then(({data,error})=>{if(error)toast.error(error.message);else setR(data??[])})},[]);return <div><Card className="bg-[#0A0A0A] border-[#D4AF37]/20"><CardHeader><CardTitle className="text-[#D4AF37]">Textos da interface</CardTitle></CardHeader><CardContent className="space-y-3">{r.map(x=><div key={x.id} className="border border-white/10 rounded p-3"><div className="text-xs text-white/50">{x.chave}</div><Input defaultValue={x.valor} id={x.id}/><Button className="mt-2" onClick={async()=>{const v=(document.getElementById(x.id) as HTMLInputElement).value;const{error}=await supabase.from("ui_textos").update({valor:v,updated_at:new Date().toISOString()}).eq("id",x.id);if(error)toast.error(error.message);else toast.success("Texto salvo")}}>Salvar</Button></div>)}</CardContent></Card></div>}
