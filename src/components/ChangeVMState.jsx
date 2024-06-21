import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ToggleVMState = () => {
  const [vmId, setVmId] = useState(45184);
  const [vmState, setVmState] = useState('');

  const API_KEY = '8b701a06-20ac-4377-ac9b-7c23d1426a61';

  useEffect(() => {
    if (vmId) {
      getVMState();
    }
  }, [vmId]);

  const getVMState = async () => {
    try {
      const response = await axios.get(`https://infrahub-api.nexgencloud.com/v1/core/virtual-machines/${vmId}`, {
        headers: {
          'api_key': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        setVmState(response.data.instance.status);
      } else {
        alert(`Error al obtener el estado de la máquina virtual: ${response.status}`);
      }
    } catch (error) {
      console.error('Error al obtener el estado de la máquina virtual:', error);
      alert('Error al intentar obtener el estado de la máquina virtual.');
    }
  };

  const toggleVMState = async () => {
    let endpoint;
    if (vmState === 'HIBERNATED') {
      endpoint = `https://infrahub-api.nexgencloud.com/v1/core/virtual-machines/${vmId}/hibernate-restore`;
    } else if (vmState === 'ACTIVE') {
      endpoint = `https://infrahub-api.nexgencloud.com/v1/core/virtual-machines/${vmId}/hibernate`;
    } else {
      alert('La máquina virtual no está en un estado válido para esta operación.');
      return;
    }

    try {
      const response = await axios.get(endpoint, {
        headers: {
          'api_key': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        setVmState(vmState === 'HIBERNATED' ? 'RESTORING' : 'HIBERNATING');
        alert(`La máquina virtual se ha ${vmState === 'HIBERNATED' ? 'restaurado' : 'invernado'} exitosamente.`);
      } else {
        alert(`Error al intentar ${vmState === 'HIBERNATED' ? 'restaurar' : 'invernar'} la máquina virtual: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error al ${vmState === 'HIBERNATED' ? 'restaurar' : 'invernar'} la máquina virtual:`, error);
      alert(`Error al intentar ${vmState === 'HIBERNATED' ? 'restaurar' : 'invernar'} la máquina virtual.`);
    }
  };

  const rebootVM = async () => {
    const endpoint = `https://infrahub-api.nexgencloud.com/v1/core/virtual-machines/${vmId}/hard-reboot`;
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'api_key': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        setVmState('REBOOTING');
        alert('La máquina virtual se está reiniciando.');
      } else {
        alert(`Error al intentar reiniciar la máquina virtual: ${response.status}`);
      }
    } catch (error) {
      console.error('Error al reiniciar la máquina virtual:', error);
      alert('Error al intentar reiniciar la máquina virtual.');
    }
  };

  return (
    <div>      
      <div style={{display: 'flex', flexDirection: 'column',gap: '10px'}}>
        <input
          type="text"
          placeholder="ID de la Máquina Virtual"
          value={vmId}
          onChange={(e) => setVmId(e.target.value)}
        />
        <button onClick={toggleVMState}>
            {vmState === 'HIBERNATED' ? 'Restaurar VM' : 'Invernar VM'}
        </button>
        <button onClick={rebootVM}>Reiniciar VM</button>
        <p>Estado actual: {vmState}</p>
      </div>      
      
    </div>
  );
};

export default ToggleVMState;
