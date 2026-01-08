import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface SessionExpiredModalProps {
  open: boolean;
  onConfirm: () => void;
}

const SessionExpiredModal = ({ open, onConfirm }: SessionExpiredModalProps) => {
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Session Expired",
      description: "Your session has expired for security reasons. Please log in again to continue.",
      button: "OK",
    },
    tr: {
      title: "Oturum Süresi Doldu",
      description: "Güvenliğiniz için oturumunuz sona erdi. Devam etmek için lütfen tekrar giriş yapın.",
      button: "Tamam",
    },
    es: {
      title: "Sesión Expirada",
      description: "Su sesión ha expirado por razones de seguridad. Por favor, inicie sesión nuevamente para continuar.",
      button: "OK",
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.title}</AlertDialogTitle>
          <AlertDialogDescription>{t.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm}>{t.button}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionExpiredModal;
