import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import CustomModal from "../components/CustomModal";

function UploadPdf() {

  const [file, setFile] = useState(null);

  const userId = localStorage.getItem("userId");

  const block = localStorage.getItem(
    "selectedBlock"
  );

  const [modalConfig, setModalConfig] = useState({
      isOpen: false,
      title: "",
      message: "",
      type: "info"
  });

  const showAlert = (title, message, type = "info") => {
      setModalConfig({
          isOpen: true,
          title,
          message,
          type
      });
  };

  const uploadPdf = async () => {

    if (!file) {
      showAlert("Selection Required", "Please select a PDF file before uploading.", "warning");
      return;
    }

    try {

      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "userId",
        userId
      );

      formData.append(
        "block",
        block
      );

      await axios.post(
        `${import.meta.env.VITE_API_URL || "https://printer-backend-kgzp.onrender.com"}/api/pdf/upload`,
        formData
      );

      showAlert("Success", "Your PDF has been successfully uploaded and is ready to print!", "success");

      setFile(null);

    } catch (error) {

      console.error(error);

      showAlert("Upload Failed", "There was an error uploading your PDF. Please try again.", "error");
    }
  };

  return (

    <main className="page-shell">

      <motion.section
        className="content-wrap panel p-6"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <p className="eyebrow">
          Upload
        </p>

        <h1 className="title">
          PDF Upload
        </h1>

        <div
          className="mt-3 mb-5 rounded-lg bg-slate-100 p-3"
        >
          <strong>
            Printing Location :
          </strong>{" "}
          {block || "Not Selected"}
        </div>

        <label
          className="upload-zone mt-6 block"
        >

          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFile(
                e.target.files[0]
              )
            }
            className="hidden"
          />

          <div
            className="text-center font-black text-slate-900"
          >
            {file
              ? file.name
              : "Choose a PDF file"}
          </div>

        </label>

        <button
          onClick={uploadPdf}
          className="btn mt-5"
        >
          Upload PDF
        </button>

      </motion.section>

      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

    </main>
  );
}

export default UploadPdf;