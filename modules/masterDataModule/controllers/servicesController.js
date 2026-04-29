const { getServices, fetchServices } = require("../services/service");

const servicesController = async (req, res) => {
  res.send({
    message: "Services fetched successfully.",
    data: await getServices(req.query),
  });
};

const getServiceByIdController = async (req, res) => {
  try {
    const [service] = await fetchServices({ id: req.params.id }, ['id', 'name']);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service fetched successfully',
      data: service,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Something went wrong',
    });
  }
};

module.exports = {
  servicesController,
  getServiceByIdController
};
