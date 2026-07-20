"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MessageType = "text" | "image" | "location" | "audio" | "document";

interface Message {
  id: string;
  senderId: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  time: string;
}



export default function ChatInterface() {
  const searchParams = useSearchParams();
  const urlContactId = searchParams.get("contact");
  const urlListingId = searchParams.get("listing");

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) return;
        const myId = session.data.session.user.id;
        
        // Récupérer les messages liés à l'utilisateur
        const { data, error } = await supabase
          .from("messages")
          .select("sender_id, receiver_id, content, created_at, type, listing_id")
          .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
          .order("created_at", { ascending: false })
          .limit(200);

        if (data && data.length > 0) {
          const contactMap = new Map();
          
          data.forEach((msg: any) => {
            const otherId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id;
            if (!contactMap.has(otherId)) {
              const safeOtherId = otherId || "inconnu";
              contactMap.set(otherId, {
                id: otherId,
                listingId: msg.listing_id,
                name: `Client ${safeOtherId.substring(0, 4)}`, // Placeholder
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${safeOtherId}`,
                lastMessage: msg.type === 'text' ? msg.content : `[${msg.type}]`,
                time: new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                unread: 0,
                online: true
              });
            }
          });
          
          const realContacts = Array.from(contactMap.values());
          setContacts(realContacts);
          
          // Essayer de récupérer les vrais profils si possible (optionnel)
          try {
            const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', realContacts.map(c => c.id));
            if (profiles && profiles.length > 0) {
              const enrichedContacts = realContacts.map(c => {
                const p = profiles.find(pr => pr.id === c.id);
                if (p) {
                  return { ...c, name: p.full_name || c.name, avatar: p.avatar_url || c.avatar };
                }
                return c;
              });
              setContacts(enrichedContacts);
              // Auto-select contact from URL params if provided
              if (urlContactId) {
                const target = enrichedContacts.find((c: any) => c.id === urlContactId);
                setActiveContact(target || enrichedContacts[0]);
              } else {
                setActiveContact(enrichedContacts[0]);
              }
              return;
            }
          } catch(e) {}
          
          // Auto-select contact from URL params if provided
          if (urlContactId) {
            const target = realContacts.find((c: any) => c.id === urlContactId);
            setActiveContact(target || realContacts[0]);
          } else {
            setActiveContact(realContacts[0]);
          }
        } else if (urlContactId) {
          // No existing messages but we have a URL contact — create a placeholder entry
          const placeholderId = urlContactId;
          const newContact = {
            id: placeholderId,
            listingId: urlListingId || null,
            name: `Client ${placeholderId.substring(0, 4)}`,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${placeholderId}`,
            lastMessage: "Nouvelle conversation",
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            unread: 0,
            online: true
          };
          // Fetch the profile name for this contact
          try {
            const { data: prof } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', placeholderId).single();
            if (prof) {
              newContact.name = prof.full_name || newContact.name;
              newContact.avatar = prof.avatar_url || newContact.avatar;
            }
          } catch(e) {}
          setContacts([newContact]);
          setActiveContact(newContact);
        } else {
          // Aucun message, on laisse la liste vide pour afficher l'Empty State
          setContacts([]);
          setActiveContact(null);
        }
      } catch(e) {}
    };
    
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!activeContact) return;

    // Réinitialiser les messages lors du changement de contact avant le fetch
    setMessages([]);

    let myId = "";
    
    // 2. Essayer de récupérer les vrais messages depuis Supabase si disponibles
    const fetchRealMessages = async () => {
      if (activeContact.id === "support") return;
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) return;
        
        myId = session.data.session.user.id;
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${myId},receiver_id.eq.${activeContact.id}),and(sender_id.eq.${activeContact.id},receiver_id.eq.${myId})`)
          .order("created_at", { ascending: true })
          .limit(50);
          
        if (data && data.length > 0) {
          const formattedMessages = data.map((m: any) => ({
            id: m.id.toString(),
            senderId: m.sender_id === myId ? "me" : "other",
            type: m.type || "text",
            content: m.content,
            mediaUrl: m.media_url,
            time: new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          }));
          setMessages(formattedMessages);
        }
      } catch (e) {
        console.error("Erreur récupération messages:", e);
      }
    };
    
    fetchRealMessages();

    // 3. Activer le mode Temps Réel (Realtime) pour "discuter normalement" avec les clients
    const channel = supabase
      .channel("chat_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as any;
          
          // Vérifier si le message concerne la discussion active
          const isRelevant = 
            (newMsg.sender_id === myId && newMsg.receiver_id === activeContact.id) ||
            (newMsg.sender_id === activeContact.id && newMsg.receiver_id === myId);

          if (isRelevant) {
            // Si c'est nous qui avons envoyé le message, on ignore car on l'a déjà ajouté visuellement (Optimistic UI)
            if (newMsg.sender_id === myId) return;

            const incomingMessage: Message = {
              id: newMsg.id.toString(),
              senderId: "other",
              type: newMsg.type || "text",
              content: newMsg.content,
              mediaUrl: newMsg.media_url,
              time: new Date(newMsg.created_at || Date.now()).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            };
            
            setMessages((prev) => [...prev, incomingMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeContact]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "me",
      type: "text",
      content: inputText.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    try {
      const session = await supabase.auth.getSession();
      if (session.data.session && activeContact.id !== "support") {
        await supabase.from("messages").insert([{
          sender_id: session.data.session.user.id,
          receiver_id: activeContact.id,
          listing_id: activeContact.listingId,
          content: newMessage.content,
          type: "text"
        }]);
      }
    } catch(e) {}
  };

  const handleFileUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const t = isImage ? "image" : "document";
    
    const localUrl = URL.createObjectURL(file);
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "me",
      type: t,
      mediaUrl: localUrl,
      content: file.name,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      if (!userId) return;

      const fallbackExt = isImage ? "jpg" : "bin";
      const safeExt = (file.name.split(".").pop() || fallbackExt).toLowerCase().replace(/[^a-z0-9]/g, "") || fallbackExt;
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
      const { error } = await supabase.storage.from("chat_media").upload(fileName, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
      
      if (!error) {
        const { data: signedUrlData } = await supabase.storage
          .from("chat_media")
          .createSignedUrl(fileName, 60 * 60 * 24 * 7);

        await supabase.from("messages").insert([{
          sender_id: userId,
          receiver_id: activeContact.id,
          listing_id: activeContact.listingId,
          type: t,
          media_url: signedUrlData?.signedUrl || localUrl,
          content: file.name
        }]);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const content = `Localisation GPS partagée\nLat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`;
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: "me",
          type: "location",
          content,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages(prev => [...prev, newMessage]);
        
        supabase.auth.getSession().then(({ data: sessionData }) => {
          if (sessionData.session) {
            supabase.from("messages").insert([{
              sender_id: sessionData.session.user.id,
              receiver_id: activeContact.id,
              listing_id: activeContact.listingId,
              type: "location",
              content
            }]).then();
          }
        });
      }, (err) => alert("Impossible d'accéder à la position GPS."));
    } else {
      alert("La géolocalisation n'est pas supportée par ce navigateur.");
    }
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-dark-900 rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border shadow-sm font-sans">
      <div className="w-[80px] md:w-[320px] flex-shrink-0 border-r border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-900/50 flex flex-col z-10">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border h-[72px] flex items-center justify-between">
          <h2 className="text-gray-900 dark:text-white font-bold text-lg hidden md:block">Discussions</h2>
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-dark-800 flex items-center justify-center text-gray-500 dark:text-white mx-auto md:mx-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </div>
        </div>
        
        <div className="hidden md:block p-3 border-b border-gray-100 dark:border-dark-border">
          <div className="relative">
            <input type="text" placeholder="Rechercher un client..." className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-green transition" />
            <svg className="absolute left-3 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {contacts.map(contact => (
            <button 
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${activeContact?.id === contact.id ? "bg-white dark:bg-dark-800 shadow-sm border border-gray-200 dark:border-dark-border" : "hover:bg-gray-100 dark:hover:bg-dark-800/50 border border-transparent"}`}
            >
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-200 dark:border-dark-border">
                  <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                </div>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green rounded-full border-2 border-white dark:border-dark-900"></div>
                )}
              </div>
              <div className="hidden md:flex flex-col flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-gray-900 dark:text-white font-semibold text-[.9rem] truncate">{contact.name}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[.7rem] shrink-0">{contact.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-[.8rem] truncate ${contact.unread > 0 ? "text-gray-900 dark:text-white font-bold" : "text-gray-500 dark:text-gray-400"}`}>
                    {contact.lastMessage}
                  </span>
                  {contact.unread > 0 && (
                    <span className="bg-brand-red text-white text-[.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

        {activeContact ? (
          <div className="flex-1 flex flex-col min-w-0 relative">
            <div className="flex items-center justify-between p-4 h-[72px] border-b border-gray-200 dark:border-dark-border bg-white/90 dark:bg-dark-900/90 backdrop-blur-md z-20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-dark-border">
                    <img src={activeContact.avatar} alt={activeContact.name} className="w-full h-full object-cover" />
                  </div>
                  {activeContact.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green rounded-full border-2 border-white dark:border-dark-900"></div>}
                </div>
                <div>
                  <h2 className="text-gray-900 dark:text-white font-bold text-[1rem] leading-tight">{activeContact.name}</h2>
                  <div className="text-green text-[.75rem] font-medium">{activeContact.online ? "En ligne" : "Vu récemment"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 hidden sm:flex">
                <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-green hover:bg-green/10 transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </button>
                <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-green hover:bg-green/10 transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                </button>
                <div className="w-px h-5 bg-gray-200 dark:bg-dark-border mx-1"></div>
                <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
              </div>
            </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar relative z-10 bg-gray-50/30 dark:bg-[#0c0d12]">
          <div className="text-center mb-6">
            <span className="bg-white dark:bg-dark-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border px-3 py-1 rounded-full text-[.7rem] font-medium shadow-sm">{"Aujourd'hui"}</span>
          </div>

          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === "me";
              const bubbleClasses = `relative w-max max-w-[85%] sm:max-w-[70%] ${isMe ? "ml-auto" : "mr-auto"}`;
              
              const bubbleBg = isMe 
                ? "bg-green text-white rounded-2xl rounded-tr-sm shadow-sm" 
                : "bg-white dark:bg-dark-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-dark-border shadow-sm";

              if (msg.type === "text") {
                return (
                  <div key={msg.id} className={`${bubbleClasses}`}>
                    <div className={`${bubbleBg} px-4 py-3`}>
                      <p className="text-[.95rem] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[.65rem] ${isMe ? "text-green-100" : "text-gray-400"}`}>
                        <span>{msg.time}</span>
                        {isMe && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === "location") {
                return (
                  <div key={msg.id} className={`${bubbleClasses}`}>
                    <div className={`${bubbleBg} p-1.5`}>
                      <div className="relative rounded-xl overflow-hidden aspect-video min-w-[240px] bg-gray-100 dark:bg-dark-900 border border-black/5 flex flex-col justify-end p-3">
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        
                        <div className="absolute top-[30%] left-[50%] translate-x-[-50%] flex flex-col items-center">
                          <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          </div>
                        </div>

                        <div className={`relative z-10 mt-auto p-2 rounded-lg ${isMe ? "bg-green-600/90" : "bg-white/90 dark:bg-dark-800/90"} backdrop-blur-sm`}>
                          <h4 className={`font-bold text-[.85rem] leading-tight ${isMe ? "text-white" : "text-gray-900 dark:text-white"}`}>{msg.content?.split("\n")[0]}</h4>
                          <p className={`text-[.75rem] ${isMe ? "text-green-50" : "text-gray-500"}`}>{msg.content?.split("\n")[1]}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === "image") {
                return (
                  <div key={msg.id} className={`${bubbleClasses}`}>
                    <div className={`${bubbleBg} p-1.5`}>
                      <div className="relative rounded-xl overflow-hidden aspect-video min-w-[240px] bg-gray-200 dark:bg-dark-900">
                        <img src={msg.mediaUrl} alt="attachment" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition cursor-pointer">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[.65rem] text-white">
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === "audio") {
                return (
                  <div key={msg.id} className={`${bubbleClasses}`}>
                    <div className={`${bubbleBg} px-4 py-3 flex items-center gap-3 min-w-[220px]`}>
                      <button className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm cursor-pointer ${isMe ? "bg-white text-green" : "bg-green text-white"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      </button>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-0.5 h-6">
                          {[...Array(20)].map((_, i) => (
                            <div key={i} className={`w-1 rounded-full ${isMe ? "bg-white/70" : "bg-gray-300 dark:bg-gray-600"}`} style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
                          ))}
                        </div>
                        <div className={`flex items-center justify-between mt-1 text-[.65rem] ${isMe ? "text-green-100" : "text-gray-400"}`}>
                          <span>0:18</span>
                          <div className="flex items-center gap-1">
                            <span>{msg.time}</span>
                            {isMe && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === "document") {
                return (
                  <div key={msg.id} className={`${bubbleClasses}`}>
                    <div className={`${bubbleBg} px-4 py-3 flex items-center gap-3`}>
                      <div className={`p-2 rounded-lg ${isMe ? "bg-white/20" : "bg-gray-100 dark:bg-dark-700"}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[.9rem] truncate">{msg.content || "Document"}</p>
                        <p className={`text-[.7rem] ${isMe ? "text-green-100" : "text-gray-400"}`}>1 Fichier</p>
                      </div>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[.65rem] ${isMe ? "text-green-100" : "text-gray-400"}`}>
                        <span>{msg.time}</span>
                        {isMe && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-border z-20">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <div className="relative">
              <button 
                onClick={() => setIsAttachOpen(!isAttachOpen)}
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 transition"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              
              {isAttachOpen && (
                <div className="absolute bottom-14 left-0 w-48 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border rounded-xl shadow-lg p-2 flex flex-col gap-1 z-50">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={(e) => { setIsAttachOpen(false); handleFileUpload(e); }}
                  />
                  {[
                    { id: "photo", label: "Photos", action: () => { if(fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); } }, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
                    { id: "location", label: "Localisation", action: () => { setIsAttachOpen(false); handleSendLocation(); }, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
                    { id: "file", label: "Document", action: () => { if(fileInputRef.current) { fileInputRef.current.accept = "application/pdf,.doc,.docx,.zip"; fileInputRef.current.click(); } }, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> },
                  ].map(item => (
                    <button key={item.id} onClick={item.action} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 transition text-sm font-medium">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-900 flex items-center justify-center text-green">
                        {item.icon}
                      </div>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Écrivez votre message..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="w-full h-11 rounded-full border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-800 pl-4 pr-10 text-[.95rem] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green focus:bg-white dark:focus:bg-dark-900 transition"
              />
            </div>

            <button 
              onClick={inputText.trim() ? handleSend : undefined}
              className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white transition-all duration-200 ${inputText.trim() ? "bg-green hover:bg-green/90 shadow-md scale-100" : "bg-gray-300 dark:bg-dark-700 text-gray-400 dark:text-gray-500 cursor-default scale-95"}`}
            >
              {inputText.trim() ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              )}
            </button>
          </div>
        </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-[#0c0d12]">
            <div className="w-20 h-20 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucune conversation active</h3>
            <p className="text-sm text-gray-500 max-w-[300px]">Sélectionnez un contact dans la liste à gauche pour commencer à discuter ou attendez qu'un client vous contacte.</p>
          </div>
        )}
    </div>
  );
}
