import React, { useState } from 'react';
import axios from 'axios';

function ImageUpload() {
    const [file, setFile] = useState(null);

    const onFileChange = event => {
        setFile(event.target.files[0]);
    };

    const onFileUpload = () => {
        const formData = new FormData();
        formData.append("image", file);

        axios.post('http://149.36.1.177:5000/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            responseType: 'blob'  // Importante para recibir el archivo binario correctamente
        })
        .then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'depth_map.png'); // O el formato de tu imagen
            document.body.appendChild(link);
            link.click();
        })
        .catch(error => console.log(error));
    };

    return (
        <div>
            <input type="file" onChange={onFileChange} />
            <button onClick={onFileUpload}>
                Generate Map!
            </button>
        </div>
    );
}

export default ImageUpload;
