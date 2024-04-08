CREATE TABLE `contratos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `compra` float NOT NULL,
  `compra_porcentagem` float NOT NULL,
  `venda` float NOT NULL,
  `venda_porcentagem` float NOT NULL,
  `data_atualizacao` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `constraint_name` (`nome`,`tipo`,`data_atualizacao`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4;

CREATE TABLE `participacao_investidores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_investidor` varchar(100) NOT NULL,
  `compras` float NOT NULL,
  `participacao_compras` float NOT NULL,
  `vendas` float NOT NULL,
  `participacao_vendas` float NOT NULL,
  `data` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `constraint_name` (`tipo_investidor`,`data`)
) ENGINE=InnoDB AUTO_INCREMENT=421 DEFAULT CHARSET=utf8mb4